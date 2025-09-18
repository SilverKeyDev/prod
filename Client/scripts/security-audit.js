#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs dependency vulnerability scanning and security checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Simple logger utility to replace console statements
 */
class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  error(message) {
    if (this.shouldLog('error')) {
      process.stderr.write(`❌ ${message}\n`);
    }
  }

  warn(message) {
    if (this.shouldLog('warn')) {
      process.stdout.write(`⚠️  ${message}\n`);
    }
  }

  info(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`${message}\n`);
    }
  }

  debug(message) {
    if (this.shouldLog('debug')) {
      process.stdout.write(`🔍 ${message}\n`);
    }
  }

  success(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`✅ ${message}\n`);
    }
  }

  progress(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`📊 ${message}\n`);
    }
  }

  file(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`📄 ${message}\n`);
    }
  }

  package(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`📦 ${message}\n`);
    }
  }

  analysis(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`📋 ${message}\n`);
    }
  }

  audit(message) {
    if (this.shouldLog('info')) {
      process.stdout.write(`🔒 ${message}\n`);
    }
  }
}

// Configuration
const CONFIG = {
  // Vulnerability severity levels to fail on
  failOnSeverity: ['critical', 'high'],

  // Maximum age for vulnerabilities (in days)
  maxVulnerabilityAge: 30,

  // Allowed vulnerability count by severity
  allowedVulnerabilities: {
    critical: 0,
    high: 0,
    moderate: 5,
    low: 10,
  },

  // Output file for audit results
  outputFile: 'security-audit-report.json',

  // Dependencies to exclude from audit (if needed)
  excludePackages: [],
};

class SecurityAuditor {
  constructor(logLevel = 'info') {
    this.logger = new Logger(logLevel);
    this.results = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      summary: {},
      recommendations: [],
      passed: false,
    };
  }

  /**
   * Run npm audit and parse results
   */
  async runNpmAudit() {
    this.logger.debug('Running npm audit...');

    try {
      // Run npm audit with JSON output
      const auditOutput = execSync('npm audit --json', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      const auditData = JSON.parse(auditOutput);
      this.processAuditResults(auditData);
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          this.processAuditResults(auditData);
        } catch (parseError) {
          this.logger.error(`Failed to parse npm audit output: ${parseError.message}`);
          throw parseError;
        }
      } else {
        this.logger.error(`npm audit failed: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Process npm audit results
   */
  processAuditResults(auditData) {
    const { vulnerabilities = {} } = auditData;

    // Extract vulnerability information
    Object.entries(vulnerabilities).forEach(([packageName, vulnData]) => {
      if (CONFIG.excludePackages.includes(packageName)) {
        return;
      }

      vulnData.via?.forEach((via) => {
        if (typeof via === 'object' && via.severity) {
          this.results.vulnerabilities.push({
            package: packageName,
            severity: via.severity,
            title: via.title,
            url: via.url,
            range: vulnData.range,
            fixAvailable: vulnData.fixAvailable,
            cwe: via.cwe,
            cvss: via.cvss,
          });
        }
      });
    });

    // Generate summary
    this.results.summary = {
      total: this.results.vulnerabilities.length,
      critical: this.results.vulnerabilities.filter((v) => v.severity === 'critical').length,
      high: this.results.vulnerabilities.filter((v) => v.severity === 'high').length,
      moderate: this.results.vulnerabilities.filter((v) => v.severity === 'moderate').length,
      low: this.results.vulnerabilities.filter((v) => v.severity === 'low').length,
      info: this.results.vulnerabilities.filter((v) => v.severity === 'info').length,
    };

    this.logger.progress(`Found ${this.results.summary.total} vulnerabilities:`);
    this.logger.info(`   Critical: ${this.results.summary.critical}`);
    this.logger.info(`   High: ${this.results.summary.high}`);
    this.logger.info(`   Moderate: ${this.results.summary.moderate}`);
    this.logger.info(`   Low: ${this.results.summary.low}`);
  }

  /**
   * Check for outdated dependencies
   */
  async checkOutdatedDependencies() {
    this.logger.debug('Checking for outdated dependencies...');

    try {
      const outdatedOutput = execSync('npm outdated --json', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      if (outdatedOutput.trim()) {
        const outdatedData = JSON.parse(outdatedOutput);
        const outdatedCount = Object.keys(outdatedData).length;

        this.logger.package(`Found ${outdatedCount} outdated dependencies`);

        this.results.outdatedDependencies = outdatedData;
        this.results.summary.outdated = outdatedCount;
      } else {
        this.logger.success('All dependencies are up to date');
        this.results.summary.outdated = 0;
      }
    } catch (error) {
      // npm outdated returns non-zero exit code when outdated packages exist
      if (error.stdout && error.stdout.trim()) {
        const outdatedData = JSON.parse(error.stdout);
        const outdatedCount = Object.keys(outdatedData).length;

        this.logger.package(`Found ${outdatedCount} outdated dependencies`);

        this.results.outdatedDependencies = outdatedData;
        this.results.summary.outdated = outdatedCount;
      } else {
        this.logger.success('All dependencies are up to date');
        this.results.summary.outdated = 0;
      }
    }
  }

  /**
   * Analyze package.json for security best practices
   */
  analyzePackageJson() {
    this.logger.analysis('Analyzing package.json for security best practices...');

    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      this.logger.warn('package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const issues = [];

    // Check for exact version pinning
    const checkVersions = (deps, type) => {
      if (!deps) return;

      Object.entries(deps).forEach(([name, version]) => {
        if (version.startsWith('^') || version.startsWith('~') || version.includes('*')) {
          issues.push({
            type: 'loose_version',
            package: name,
            version,
            section: type,
            recommendation: 'Consider pinning to exact versions for better security',
          });
        }
      });
    };

    checkVersions(packageJson.dependencies, 'dependencies');
    checkVersions(packageJson.devDependencies, 'devDependencies');

    // Check for security-related scripts
    const hasSecurityScripts =
      packageJson.scripts &&
      (packageJson.scripts.audit ??
        packageJson.scripts['security-check'] ??
        packageJson.scripts['vulnerability-check']);

    if (!hasSecurityScripts) {
      issues.push({
        type: 'missing_security_scripts',
        recommendation: 'Add security audit scripts to package.json',
      });
    }

    this.results.packageAnalysis = {
      issues,
      hasLockFile: fs.existsSync(path.join(process.cwd(), 'package-lock.json')),
      hasSecurityScripts,
    };

    this.logger.analysis(`Package analysis found ${issues.length} potential issues`);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Vulnerability-based recommendations
    if (this.results.summary.critical > 0) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediately update packages with critical vulnerabilities',
        command: 'npm audit fix --force',
      });
    }

    if (this.results.summary.high > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Update packages with high severity vulnerabilities',
        command: 'npm audit fix',
      });
    }

    if (this.results.summary.outdated > 5) {
      recommendations.push({
        priority: 'medium',
        action: 'Update outdated dependencies',
        command: 'npm update',
      });
    }

    // Package analysis recommendations
    if (this.results.packageAnalysis?.issues.length > 0) {
      recommendations.push({
        priority: 'low',
        action: 'Review package.json security practices',
        details: this.results.packageAnalysis.issues,
      });
    }

    this.results.recommendations = recommendations;
  }

  /**
   * Determine if audit passes security requirements
   */
  evaluateResults() {
    let passed = true;
    const failures = [];

    // Check against allowed vulnerability counts
    Object.entries(CONFIG.allowedVulnerabilities).forEach(([severity, maxCount]) => {
      const actualCount = this.results.summary[severity] ?? 0;
      if (actualCount > maxCount) {
        passed = false;
        failures.push(`${severity}: ${actualCount} (max: ${maxCount})`);
      }
    });

    // Check for fail-on severity levels
    CONFIG.failOnSeverity.forEach((severity) => {
      const count = this.results.summary[severity] ?? 0;
      if (count > 0) {
        passed = false;
        failures.push(`${severity} vulnerabilities not allowed: ${count} found`);
      }
    });

    this.results.passed = passed;
    this.results.failures = failures;

    if (passed) {
      this.logger.success('Security audit passed');
    } else {
      this.logger.error('Security audit failed:');
      failures.forEach((failure) => this.logger.info(`   - ${failure}`));
    }
  }

  /**
   * Save results to file
   */
  saveResults() {
    const outputPath = path.join(process.cwd(), CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    this.logger.file(`Results saved to ${CONFIG.outputFile}`);
  }

  /**
   * Run complete security audit
   */
  async run() {
    this.logger.audit('Starting security audit...\n');

    try {
      await this.runNpmAudit();
      await this.checkOutdatedDependencies();
      this.analyzePackageJson();
      this.generateRecommendations();
      this.evaluateResults();
      this.saveResults();

      this.logger.audit('\nSecurity audit completed');

      // Exit with appropriate code
      process.exit(this.results.passed ? 0 : 1);
    } catch (error) {
      this.logger.error(`Security audit failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run();
}

module.exports = SecurityAuditor;
