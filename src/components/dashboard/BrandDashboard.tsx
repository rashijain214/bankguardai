import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Eye,
  MessageCircle,
  Target,
  BarChart3
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const mockStats = {
  activeCampaigns: 5,
  totalSpent: 12500,
  applicationsReceived: 48,
  completedCampaigns: 23,
  avgEngagementRate: 4.2,
  conversionRate: 8.5,
};

const mockCampaigns = [
  {
    id: '1',
    title: 'Summer Collection Launch',
    budget: 2500,
    applications: 12,
    deadline: '2024-02-15',
    status: 'active',
    niches: ['Fashion', 'Lifestyle'],
  },
  {
    id: '2',
    title: 'Tech Product Demo',
    budget: 1800,
    applications: 8,
    deadline: '2024-02-20',
    status: 'active',
    niches: ['Technology', 'Gaming'],
  },
  {
    id: '3',
    title: 'Fitness Challenge Promo',
    budget: 1200,
    applications: 15,
    deadline: '2024-02-10',
    status: 'review',
    niches: ['Fitness', 'Health'],
  },
];

const mockApplications = [
  {
    id: '1',
    creatorName: 'Sarah Johnson',
    campaignTitle: 'Summer Collection Launch',
    followers: 25000,
    engagement: 4.8,
    rate: 450,
    submittedAt: '2024-01-28',
  },
  {
    id: '2',
    creatorName: 'Mike Chen',
    campaignTitle: 'Tech Product Demo',
    followers: 45000,
    engagement: 5.2,
    rate: 650,
    submittedAt: '2024-01-27',
  },
  {
    id: '3',
    creatorName: 'Emma Davis',
    campaignTitle: 'Fitness Challenge Promo',
    followers: 18000,
    engagement: 6.1,
    rate: 320,
    submittedAt: '2024-01-26',
  },
];

export const BrandDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, TechCorp! 🚀
        </h1>
        <p className="text-gray-600">
          Manage your campaigns and connect with talented creators.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.activeCampaigns}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {mockStats.applicationsReceived} total applications
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${mockStats.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <TrendingUp size={16} className="mr-1" />
              +8% ROI increase
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.avgEngagementRate}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Across all campaigns
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.conversionRate}%</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Users className="text-yellow-600" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              From creator content
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Campaigns */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Campaigns</h2>
              <Button>Create Campaign</Button>
            </div>
            
            <div className="space-y-4">
              {mockCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{campaign.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {campaign.niches.map((niche, idx) => (
                          <Badge key={idx} variant="info" size="sm">
                            {niche}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge
                      variant={
                        campaign.status === 'active' ? 'success' :
                        campaign.status === 'review' ? 'warning' : 'default'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium text-green-600">
                        ${campaign.budget.toLocaleString()}
                      </span>
                      <p className="text-xs">Budget</p>
                    </div>
                    <div>
                      <span className="font-medium">{campaign.applications}</span>
                      <p className="text-xs">Applications</p>
                    </div>
                    <div>
                      <span className="font-medium">
                        {new Date(campaign.deadline).toLocaleDateString()}
                      </span>
                      <p className="text-xs">Deadline</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">View Applications</Button>
                    <Button size="sm">Manage</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Applications & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start">
                <Target size={16} className="mr-2" />
                Create New Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users size={16} className="mr-2" />
                Browse Creators
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 size={16} className="mr-2" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageCircle size={16} className="mr-2" />
                Messages
              </Button>
            </div>
          </Card>

          {/* Recent Applications */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            
            <div className="space-y-3">
              {mockApplications.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{app.creatorName}</p>
                      <p className="text-xs text-gray-600">{app.campaignTitle}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">{app.followers.toLocaleString()}</span>
                      <span className="ml-1">followers</span>
                    </div>
                    <div>
                      <span className="font-medium">{app.engagement}%</span>
                      <span className="ml-1">engagement</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">
                      ${app.rate}
                    </span>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Campaign Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-green-600">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On-time Delivery</span>
                <span className="text-sm font-medium text-blue-600">89%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Your campaigns are performing excellently! Keep up the great work with clear briefs and fair compensation.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};