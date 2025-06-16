/**
 * BankGuard AI - Main Dashboard Page
 * 
 * The primary dashboard interface showing real-time fraud detection
 * metrics, alerts, and system status. Designed for bank administrators
 * to monitor fraud detection operations at a glance.
 * 
 * Features:
 * - Real-time fraud statistics and metrics
 * - Live alert feed with severity indicators
 * - System health and performance monitoring
 * - Quick action buttons for common tasks
 * - Responsive design with accessibility features
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Activity,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Components
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RealTimeChart } from '../components/charts/RealTimeChart';
import { AlertFeed } from '../components/alerts/AlertFeed';
import { SystemStatus } from '../components/system/SystemStatus';

// Hooks and stores
import { useFraudStats } from '../hooks/useFraudStats';
import { useRealTimeAlerts } from '../hooks/useRealTimeAlerts';

// Types
interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

export const DashboardPage: React.FC = () => {
  const { stats, loading: statsLoading, error: statsError, refetch } = useFraudStats('24h');
  const { alerts, loading: alertsLoading } = useRealTimeAlerts();

  // Calculate dashboard metrics
  const metrics: DashboardMetric[] = React.useMemo(() => {
    if (!stats) return [];

    return [
      {
        label: 'Total Sessions',
        value: stats.totalSessions.toLocaleString(),
        change: 12.5,
        changeType: 'increase',
        icon: <Users className="w-6 h-6" />,
        color: 'blue',
      },
      {
        label: 'Fraud Rate',
        value: `${stats.fraudRate.toFixed(2)}%`,
        change: -2.3,
        changeType: 'decrease',
        icon: <Shield className="w-6 h-6" />,
        color: 'green',
      },
      {
        label: 'High Risk Sessions',
        value: stats.highRiskSessions.toLocaleString(),
        change: 8.7,
        changeType: 'increase',
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'red',
      },
      {
        label: 'Avg Risk Score',
        value: stats.averageRiskScore.toFixed(3),
        change: 1.2,
        changeType: 'increase',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'yellow',
      },
    ];
  }, [stats]);

  // Recent alerts for quick view
  const recentAlerts = React.useMemo(() => {
    return alerts.slice(0, 5);
  }, [alerts]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600 mb-4">
          Unable to load fraud detection statistics.
        </p>
        <Button onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Fraud Detection Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and analytics for banking security
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Live Monitor
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <div className={`text-${metric.color}-600`}>
                    {metric.icon}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <div className={`flex items-center text-sm ${
                  metric.changeType === 'increase' ? 'text-green-600' :
                  metric.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {metric.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : metric.changeType === 'decrease' ? (
                    <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                  ) : null}
                  {Math.abs(metric.change)}%
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  vs last 24h
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Chart */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Real-time Fraud Detection
              </h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
            </div>
            
            <RealTimeChart />
          </Card>
        </div>

        {/* Recent Alerts */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Alerts
              </h2>
              <Badge variant="info" size="sm">
                {alerts.length} Active
              </Badge>
            </div>
            
            <AlertFeed 
              alerts={recentAlerts} 
              loading={alertsLoading}
              compact={true}
            />
            
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View All Alerts
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* System Status and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            System Status
          </h2>
          <SystemStatus />
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-3" />
              Configure Fraud Thresholds
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-3" />
              Manage User Accounts
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Activity className="w-4 h-4 mr-3" />
              View System Logs
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-3" />
              Generate Reports
            </Button>
          </div>
        </Card>
      </div>

      {/* Fraud Pattern Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Fraud Pattern Analysis
          </h2>
          <Button variant="outline" size="sm">
            View Patterns
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats?.anomalyTypes && Object.entries(stats.anomalyTypes).map(([type, count]) => (
            <div key={type} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {type.replace('_', ' ')}
                </span>
                <Badge variant="info" size="sm">
                  {count}
                </Badge>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((count as number / stats.totalSessions) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};