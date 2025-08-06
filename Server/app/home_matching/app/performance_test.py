"""
Performance testing and analysis module for the home matching system.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import time
import logging
from typing import List, Dict, Any, Tuple
import warnings
warnings.filterwarnings('ignore')

from home_matching import (
    find_best_matches, 
    score_single_match,
    compare_homes_for_user,
    create_sample_user,
    create_sample_home
)

logger = logging.getLogger(__name__)

class PerformanceTester:
    """Comprehensive performance testing for the home matching system."""
    
    def __init__(self):
        self.results = {}
        
    def benchmark_scoring_methods(self, users: List[Dict], homes: List[Dict]) -> pd.DataFrame:
        """Benchmark the performance of different scoring methods."""
        print("⏱️ Benchmarking scoring methods...")
        
        # Test different batch sizes
        batch_sizes = [1, 5, 10, 20, min(30, len(homes))]
        results = []
        
        for batch_size in batch_sizes:
            user = users[0]
            homes_batch = homes[:batch_size]
            
            # Time the matching process
            start_time = time.time()
            try:
                matches = find_best_matches(
                    user, 
                    homes_batch, 
                    top_k=min(5, batch_size),
                    include_explanations=False  # Faster without explanations
                )
                end_time = time.time()
                duration = end_time - start_time
                
                results.append({
                    'batch_size': batch_size,
                    'duration': duration,
                    'homes_per_second': batch_size / duration if duration > 0 else 0,
                    'success': True
                })
                
                print(f"  Batch size {batch_size:2d}: {duration:.3f}s ({batch_size/duration:.1f} homes/sec)")
                
            except Exception as e:
                print(f"  Batch size {batch_size:2d}: FAILED - {e}")
                results.append({
                    'batch_size': batch_size,
                    'duration': 0,
                    'homes_per_second': 0,
                    'success': False,
                    'error': str(e)
                })
        
        return pd.DataFrame(results)
    
    def analyze_scoring_patterns(self, users: List[Dict], homes: List[Dict]) -> pd.DataFrame:
        """Analyze scoring patterns across different methods."""
        print("📊 Analyzing scoring patterns...")
        
        scoring_data = []
        
        # Sample a subset for detailed analysis
        sample_users = users[:3]
        sample_homes = homes[:15]
        
        for user in sample_users:
            for home in sample_homes:
                try:
                    result = score_single_match(user, home, include_explanations=False)
                    
                    scoring_data.append({
                        'user_id': user['user_id'],
                        'home_id': home['home_id'],
                        'user_lifestyle': user['preferences']['lifestyle'],
                        'home_neighborhood': home['neighborhood'],
                        'home_price': home['price'],
                        'user_budget_max': user['preferences']['budget_max'],
                        'price_ratio': home['price'] / user['preferences']['budget_max'],
                        'final_score': result['final_score'],
                        'embedding_score': result['scores'].get('embedding', 0),
                        'tabular_score': result['scores'].get('tabular', 0),
                        'llm_score': result['scores'].get('llm', 0)
                    })
                    
                except Exception as e:
                    logger.warning(f"Error scoring {user['user_id']} vs {home['home_id']}: {e}")
                    continue
        
        return pd.DataFrame(scoring_data)
    
    def analyze_weight_sensitivity(self, users: List[Dict], homes: List[Dict]) -> pd.DataFrame:
        """Analyze how different ensemble weights affect rankings."""
        print("⚖️ Analyzing ensemble weight sensitivity...")
        
        # Define different weight configurations
        weight_configs = [
            {'name': 'Balanced', 'embedding': 0.33, 'tabular': 0.33, 'llm': 0.34},
            {'name': 'Embedding Heavy', 'embedding': 0.7, 'tabular': 0.2, 'llm': 0.1},
            {'name': 'Tabular Heavy', 'embedding': 0.2, 'tabular': 0.7, 'llm': 0.1},
            {'name': 'LLM Heavy', 'embedding': 0.2, 'tabular': 0.2, 'llm': 0.6},
            {'name': 'Default', 'embedding': 0.4, 'tabular': 0.4, 'llm': 0.2}
        ]
        
        # Test with one user and multiple homes
        test_user = users[0]
        test_homes_sample = homes[:10]
        
        weight_results = []
        
        for config in weight_configs:
            config_name = config.pop('name')
            
            try:
                matches = find_best_matches(
                    test_user, 
                    test_homes_sample, 
                    top_k=5,
                    method_weights=config,
                    include_explanations=False
                )
                
                for rank, match in enumerate(matches, 1):
                    weight_results.append({
                        'config': config_name,
                        'home_id': match['home_id'],
                        'rank': rank,
                        'final_score': match['final_score'],
                        'embedding_weight': config['embedding'],
                        'tabular_weight': config['tabular'],
                        'llm_weight': config['llm']
                    })
                    
            except Exception as e:
                logger.warning(f"Error with config {config_name}: {e}")
                continue
        
        return pd.DataFrame(weight_results)

def create_performance_visualizations(perf_results: pd.DataFrame, scoring_df: pd.DataFrame):
    """Create comprehensive performance visualizations."""
    
    # Set up the plotting style
    plt.style.use('default')
    sns.set_palette("husl")
    
    # Performance Metrics
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Home Matching System - Performance Analysis', fontsize=16, fontweight='bold')
    
    # 1. Processing Speed vs Batch Size
    if len(perf_results) > 0 and perf_results['success'].any():
        successful_results = perf_results[perf_results['success']]
        
        axes[0, 0].plot(successful_results['batch_size'], successful_results['duration'], 
                        marker='o', linewidth=2, markersize=8, color='blue')
        axes[0, 0].set_xlabel('Batch Size (number of homes)')
        axes[0, 0].set_ylabel('Processing Time (seconds)')
        axes[0, 0].set_title('Processing Time vs Batch Size')
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Throughput (homes per second)
        axes[0, 1].bar(successful_results['batch_size'].astype(str), 
                       successful_results['homes_per_second'], 
                       color='skyblue', alpha=0.7)
        axes[0, 1].set_xlabel('Batch Size')
        axes[0, 1].set_ylabel('Homes Processed per Second')
        axes[0, 1].set_title('Processing Throughput')
        axes[0, 1].grid(True, alpha=0.3)
    else:
        axes[0, 0].text(0.5, 0.5, 'No performance data available', 
                        ha='center', va='center', transform=axes[0, 0].transAxes)
        axes[0, 1].text(0.5, 0.5, 'No throughput data available', 
                        ha='center', va='center', transform=axes[0, 1].transAxes)
    
    # 3. Score Distribution
    if len(scoring_df) > 0:
        score_cols = ['embedding_score', 'tabular_score', 'llm_score']
        colors = ['lightcoral', 'lightblue', 'lightgreen']
        
        for i, (col, color) in enumerate(zip(score_cols, colors)):
            if col in scoring_df.columns and not scoring_df[col].isna().all():
                axes[1, 0].hist(scoring_df[col].dropna(), bins=15, alpha=0.6, 
                               label=col.replace('_score', '').title(), color=color)
        
        axes[1, 0].set_xlabel('Score Value')
        axes[1, 0].set_ylabel('Frequency')
        axes[1, 0].set_title('Score Distribution by Method')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        # 4. Method Correlation Heatmap
        if len(scoring_df) > 1:
            score_columns = ['final_score'] + [col for col in score_cols if col in scoring_df.columns]
            corr_data = scoring_df[score_columns].dropna()
            
            if len(corr_data) > 1:
                corr_matrix = corr_data.corr()
                im = axes[1, 1].imshow(corr_matrix, cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
                axes[1, 1].set_xticks(range(len(corr_matrix.columns)))
                axes[1, 1].set_yticks(range(len(corr_matrix.columns)))
                axes[1, 1].set_xticklabels([col.replace('_score', '').title() for col in corr_matrix.columns], rotation=45)
                axes[1, 1].set_yticklabels([col.replace('_score', '').title() for col in corr_matrix.columns])
                axes[1, 1].set_title('Method Correlation Matrix')
                
                # Add correlation values
                for i in range(len(corr_matrix)):
                    for j in range(len(corr_matrix)):
                        axes[1, 1].text(j, i, f'{corr_matrix.iloc[i, j]:.2f}', 
                                       ha='center', va='center', 
                                       color='white' if abs(corr_matrix.iloc[i, j]) > 0.5 else 'black')
                
                plt.colorbar(im, ax=axes[1, 1], shrink=0.8)
            else:
                axes[1, 1].text(0.5, 0.5, 'Insufficient data for correlation', 
                                ha='center', va='center', transform=axes[1, 1].transAxes)
        else:
            axes[1, 1].text(0.5, 0.5, 'Insufficient data for correlation', 
                            ha='center', va='center', transform=axes[1, 1].transAxes)
    else:
        axes[1, 0].text(0.5, 0.5, 'No scoring data available', 
                        ha='center', va='center', transform=axes[1, 0].transAxes)
        axes[1, 1].text(0.5, 0.5, 'No correlation data available', 
                        ha='center', va='center', transform=axes[1, 1].transAxes)
    
    plt.tight_layout()
    plt.show()

def create_scoring_analysis_visualizations(scoring_df: pd.DataFrame):
    """Create scoring analysis visualizations."""
    
    if len(scoring_df) == 0:
        print("⚠️ No scoring data available for detailed analysis")
        return
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Scoring Method Analysis', fontsize=16, fontweight='bold')
    
    # 1. Score vs Price Ratio
    if 'price_ratio' in scoring_df.columns and 'final_score' in scoring_df.columns:
        scatter = axes[0, 0].scatter(scoring_df['price_ratio'], scoring_df['final_score'], 
                                    c=scoring_df['final_score'], cmap='viridis', alpha=0.6)
        axes[0, 0].set_xlabel('Price Ratio (Home Price / User Budget)')
        axes[0, 0].set_ylabel('Final Score')
        axes[0, 0].set_title('Final Score vs Price Affordability')
        axes[0, 0].grid(True, alpha=0.3)
        plt.colorbar(scatter, ax=axes[0, 0])
    
    # 2. Method Comparison (Box Plot)
    method_data = []
    method_labels = []
    for col in ['embedding_score', 'tabular_score', 'llm_score']:
        if col in scoring_df.columns and not scoring_df[col].isna().all():
            method_data.append(scoring_df[col].dropna().values)
            method_labels.append(col.replace('_score', '').title())
    
    if method_data:
        axes[0, 1].boxplot(method_data, labels=method_labels)
        axes[0, 1].set_ylabel('Score Value')
        axes[0, 1].set_title('Score Distribution by Method')
        axes[0, 1].grid(True, alpha=0.3)
    
    # 3. User Lifestyle vs Average Score
    if 'user_lifestyle' in scoring_df.columns and 'final_score' in scoring_df.columns:
        lifestyle_scores = scoring_df.groupby('user_lifestyle')['final_score'].agg(['mean', 'std']).reset_index()
        
        bars = axes[1, 0].bar(range(len(lifestyle_scores)), lifestyle_scores['mean'], 
                             yerr=lifestyle_scores['std'], capsize=5, alpha=0.7)
        axes[1, 0].set_xticks(range(len(lifestyle_scores)))
        axes[1, 0].set_xticklabels(lifestyle_scores['user_lifestyle'], rotation=45)
        axes[1, 0].set_ylabel('Average Final Score')
        axes[1, 0].set_title('Average Score by User Lifestyle')
        axes[1, 0].grid(True, alpha=0.3)
    
    # 4. Neighborhood vs Average Score
    if 'home_neighborhood' in scoring_df.columns and 'final_score' in scoring_df.columns:
        neighborhood_scores = scoring_df.groupby('home_neighborhood')['final_score'].agg(['mean', 'std']).reset_index()
        
        bars = axes[1, 1].bar(range(len(neighborhood_scores)), neighborhood_scores['mean'], 
                             yerr=neighborhood_scores['std'], capsize=5, alpha=0.7, color='orange')
        axes[1, 1].set_xticks(range(len(neighborhood_scores)))
        axes[1, 1].set_xticklabels(neighborhood_scores['home_neighborhood'], rotation=45)
        axes[1, 1].set_ylabel('Average Final Score')
        axes[1, 1].set_title('Average Score by Neighborhood')
        axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()

def run_comprehensive_test():
    """Run comprehensive testing suite."""
    print("🚀 Starting comprehensive home matching system test...")
    
    # Create test data
    from home_matching.app.performance_test import PerformanceTester
    
    def create_diverse_users(n_users: int = 10):
        users = []
        archetypes = [
            {'lifestyle': 'Young Professional', 'budget_range': (300000, 600000), 'bedrooms': 2},
            {'lifestyle': 'Growing Family', 'budget_range': (500000, 900000), 'bedrooms': 4},
            {'lifestyle': 'Empty Nesters', 'budget_range': (400000, 800000), 'bedrooms': 3},
            {'lifestyle': 'First-time Buyer', 'budget_range': (250000, 450000), 'bedrooms': 2}
        ]
        
        for i in range(n_users):
            archetype = archetypes[i % len(archetypes)]
            budget_min, budget_max = archetype['budget_range']
            
            user = {
                'user_id': f'test_user_{i+1:03d}',
                'preferences': {
                    'budget_min': int(budget_min * np.random.uniform(0.9, 1.1)),
                    'budget_max': int(budget_max * np.random.uniform(0.9, 1.1)),
                    'preferred_bedrooms': archetype['bedrooms'],
                    'preferred_bathrooms': archetype['bedrooms'] - 0.5,
                    'min_sqft': archetype['bedrooms'] * 500 + 500,
                    'lifestyle': archetype['lifestyle'],
                    'must_have_amenities': ['garage'] if budget_max > 400000 else [],
                    'nice_to_have_amenities': ['pool', 'gym'],
                    'housing_type': 'house',
                    'max_commute_minutes': np.random.randint(20, 45)
                }
            }
            users.append(user)
        return users
    
    def create_diverse_homes(n_homes: int = 30):
        homes = []
        neighborhoods = ['Downtown', 'Suburbs', 'Upscale', 'Affordable', 'Trendy']
        
        for i in range(n_homes):
            bedrooms = np.random.choice([2, 3, 4, 5], p=[0.2, 0.4, 0.3, 0.1])
            neighborhood = np.random.choice(neighborhoods)
            base_price = {
                'Downtown': 350, 'Suburbs': 250, 'Upscale': 450, 
                'Affordable': 200, 'Trendy': 400
            }[neighborhood]
            
            sqft = int(bedrooms * 600 + np.random.normal(800, 200))
            price = int(sqft * base_price * np.random.uniform(0.8, 1.2))
            
            home = {
                'home_id': f'test_home_{i+1:03d}',
                'address': f'{100 + i} Test St, {neighborhood}, ST',
                'price': price,
                'bedrooms': bedrooms,
                'bathrooms': bedrooms - 0.5 + np.random.choice([0, 0.5]),
                'sqft': sqft,
                'home_type': np.random.choice(['house', 'townhouse', 'condo']),
                'neighborhood': neighborhood,
                'amenities': ['garage'] if price > 300000 else [],
                'has_garage': price > 300000,
                'has_yard': price > 400000,
                'has_pool': price > 600000,
                'pet_friendly': np.random.choice([True, False]),
                'commute_minutes': np.random.randint(15, 50),
                'description': f'Beautiful home in {neighborhood}'
            }
            homes.append(home)
        return homes
    
    # Generate test data
    test_users = create_diverse_users(8)
    test_homes = create_diverse_homes(25)
    
    # Run tests
    tester = PerformanceTester()
    
    # Performance benchmark
    perf_results = tester.benchmark_scoring_methods(test_users, test_homes)
    
    # Scoring analysis
    scoring_df = tester.analyze_scoring_patterns(test_users, test_homes)
    
    # Weight sensitivity
    weight_df = tester.analyze_weight_sensitivity(test_users, test_homes)
    
    # Create visualizations
    print("\n📊 Creating performance visualizations...")
    create_performance_visualizations(perf_results, scoring_df)
    
    print("\n📈 Creating scoring analysis visualizations...")
    create_scoring_analysis_visualizations(scoring_df)
    
    # Print summary statistics
    print("\n📋 Test Summary:")
    print(f"  Users tested: {len(test_users)}")
    print(f"  Homes tested: {len(test_homes)}")
    print(f"  Scoring pairs analyzed: {len(scoring_df)}")
    
    if len(scoring_df) > 0:
        print(f"  Average final score: {scoring_df['final_score'].mean():.3f}")
        print(f"  Score standard deviation: {scoring_df['final_score'].std():.3f}")
    
    return perf_results, scoring_df, weight_df

if __name__ == "__main__":
    run_comprehensive_test()
