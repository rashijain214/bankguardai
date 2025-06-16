import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Star,
  Eye,
  MessageCircle,
  Award,
  Users
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const mockStats = {
  totalEarnings: 2450,
  activeCampaigns: 3,
  completedCampaigns: 12,
  rating: 4.8,
  profileViews: 156,
  applicationRate: 68,
};

const mockCampaigns = [
  {
    id: '1',
    title: 'Summer Fashion Collection Showcase',
    brand: 'Fashion Forward Co.',
    budget: 500,
    deadline: '2024-02-15',
    status: 'active',
    deliverables: ['1 Instagram Post', '3 Stories', '1 Reel'],
  },
  {
    id: '2',
    title: 'Tech Product Review Campaign',
    brand: 'TechCorp',
    budget: 800,
    deadline: '2024-02-20',
    status: 'pending',
    deliverables: ['1 YouTube Video', '2 Instagram Posts'],
  },
  {
    id: '3',
    title: 'Fitness Supplement Promotion',
    brand: 'HealthMax',
    budget: 350,
    deadline: '2024-02-10',
    status: 'completed',
    deliverables: ['2 Instagram Posts', '5 Stories'],
  },
];

export const CreatorDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Sarah! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your creator journey today.
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
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${mockStats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <TrendingUp size={16} className="mr-1" />
              +12% from last month
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
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.activeCampaigns}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              2 due this week
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
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.rating}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Based on {mockStats.completedCampaigns} campaigns
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
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.profileViews}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Eye className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              This month
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Campaigns */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
              <Button variant="outline" size="sm">View All</Button>
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
                      <p className="text-sm text-gray-600">{campaign.brand}</p>
                    </div>
                    <Badge
                      variant={
                        campaign.status === 'active' ? 'success' :
                        campaign.status === 'pending' ? 'warning' : 'default'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="font-medium text-green-600">${campaign.budget}</span>
                    <span>Due: {new Date(campaign.deadline).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {campaign.deliverables.map((deliverable, idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {deliverable}
                      </Badge>
                    ))}
                  </div>
                  
                  {campaign.status === 'active' && (
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm">Upload Content</Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <MessageCircle size={16} className="mr-2" />
                Browse Campaigns
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users size={16} className="mr-2" />
                Update Portfolio
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Award size={16} className="mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </Card>

          {/* Performance Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Application Success Rate</span>
                <span className="text-sm font-medium text-green-600">{mockStats.applicationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${mockStats.applicationRate}%` }}
                ></div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Your profile is performing great! Consider:
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Adding more portfolio samples</li>
                  <li>• Updating your niche preferences</li>
                  <li>• Responding faster to messages</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-900">Tech Review</p>
                  <p className="text-xs text-red-600">Due in 2 days</p>
                </div>
                <Badge variant="danger" size="sm">Urgent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Fashion Post</p>
                  <p className="text-xs text-yellow-600">Due in 5 days</p>
                </div>
                <Badge variant="warning" size="sm">Soon</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};