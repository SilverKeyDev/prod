import React, { useState } from 'react';
import { Check, Zap, Crown, Building, CreditCard, Calendar, Download } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  reportsLimit: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    interval: 'month',
    reportsLimit: 3,
    features: [
      '3 reports per month',
      'Basic property analysis',
      'Standard templates',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49,
    interval: 'month',
    reportsLimit: 50,
    popular: true,
    features: [
      '50 reports per month',
      'Advanced AI analysis',
      'Custom branding',
      'Bulk property upload',
      'Priority support',
      'Export to multiple formats'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    interval: 'month',
    reportsLimit: -1, // Unlimited
    features: [
      'Unlimited reports',
      'White-label solution',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee'
    ]
  }
];

export default function Subscription() {
  const [currentPlan] = useState('free');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [usage] = useState({
    reportsUsed: 2,
    reportsLimit: 3,
    billingDate: new Date('2024-02-15')
  });

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro':
        return <Zap className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Building className="h-6 w-6" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif text-navy mb-4">Subscription & Billing</h1>
        <p className="text-lg text-navy/60 max-w-2xl mx-auto">
          Choose the perfect plan for your real estate business needs
        </p>
      </div>

      {/* Current Usage */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-navy">Current Usage</h2>
          <span className="px-3 py-1 bg-beige/30 text-navy text-sm font-medium rounded-full">
            {plans.find(p => p.id === currentPlan)?.name} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-8 w-8 text-gold" />
            </div>
            <div className="text-2xl font-bold text-navy mb-1">
              {usage.reportsUsed}/{usage.reportsLimit === -1 ? '∞' : usage.reportsLimit}
            </div>
            <div className="text-sm text-navy/60">Reports Used</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-navy" />
            </div>
            <div className="text-2xl font-bold text-navy mb-1">
              {formatDate(usage.billingDate)}
            </div>
            <div className="text-sm text-navy/60">Next Billing Date</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-navy mb-1">
              ${plans.find(p => p.id === currentPlan)?.price || 0}
            </div>
            <div className="text-sm text-navy/60">Monthly Cost</div>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy">Report Usage</span>
            <span className="text-sm text-navy/60">
              {usage.reportsLimit === -1 ? 'Unlimited' : `${usage.reportsLimit - usage.reportsUsed} remaining`}
            </span>
          </div>
          <div className="w-full bg-beige/30 rounded-full h-2">
            <div 
              className="bg-gold h-2 rounded-full transition-all duration-300"
              style={{ 
                width: usage.reportsLimit === -1 ? '20%' : `${Math.min((usage.reportsUsed / usage.reportsLimit) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-beige/20 rounded-lg p-1 flex items-center">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              billingInterval === 'month'
                ? 'bg-white text-navy shadow-sm'
                : 'text-navy/60 hover:text-navy'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              billingInterval === 'year'
                ? 'bg-white text-navy shadow-sm'
                : 'text-navy/60 hover:text-navy'
            }`}
          >
            Annual
            <span className="ml-1 text-xs bg-gold/20 text-gold px-1 rounded">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const yearlyPrice = Math.round(plan.price * 12 * 0.8); // 20% discount
          const displayPrice = billingInterval === 'year' ? yearlyPrice : plan.price;
          
          return (
            <div
              key={plan.id}
              className={`
                relative card transition-all duration-200 hover:shadow-lg
                ${plan.popular ? 'ring-2 ring-gold shadow-lg' : ''}
                ${isCurrentPlan ? 'bg-gold/5 border-gold' : ''}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  plan.popular ? 'bg-gold text-navy' : 'bg-navy/10 text-navy'
                }`}>
                  {getPlanIcon(plan.id)}
                </div>
                
                <h3 className="text-xl font-medium text-navy mb-2">{plan.name}</h3>
                
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-navy">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-navy">${displayPrice}</span>
                      <span className="text-navy/60">
                        /{billingInterval === 'year' ? 'year' : 'month'}
                      </span>
                      {billingInterval === 'year' && plan.price > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ${(plan.price * 12) - yearlyPrice}/year
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-navy/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  isCurrentPlan
                    ? 'bg-beige/30 text-navy/60 cursor-not-allowed'
                    : plan.popular
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? 'Current Plan' : 'Upgrade to ' + plan.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Billing History */}
      <div className="card">
        <h2 className="text-xl font-medium text-navy mb-6">Billing History</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-beige">
                <th className="text-left py-3 text-sm font-medium text-navy/60">Date</th>
                <th className="text-left py-3 text-sm font-medium text-navy/60">Description</th>
                <th className="text-left py-3 text-sm font-medium text-navy/60">Amount</th>
                <th className="text-left py-3 text-sm font-medium text-navy/60">Status</th>
                <th className="text-left py-3 text-sm font-medium text-navy/60">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/50">
              {[
                {
                  date: new Date('2024-01-15'),
                  description: 'Starter Plan - January 2024',
                  amount: 0,
                  status: 'Paid',
                  invoice: '#INV-001'
                },
                {
                  date: new Date('2023-12-15'),
                  description: 'Starter Plan - December 2023',
                  amount: 0,
                  status: 'Paid',
                  invoice: '#INV-002'
                }
              ].map((transaction, index) => (
                <tr key={index} className="hover:bg-beige/10 transition-colors">
                  <td className="py-3 text-sm text-navy">
                    {transaction.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 text-sm text-navy">{transaction.description}</td>
                  <td className="py-3 text-sm text-navy">
                    {transaction.amount === 0 ? 'Free' : `$${transaction.amount}`}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="text-gold hover:text-gold-light text-sm font-medium">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}