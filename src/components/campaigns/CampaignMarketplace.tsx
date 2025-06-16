import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign,
  Eye,
  Clock,
  Users
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const mockCampaigns = [
  {
    id: '1',
    title: 'Summer Fashion Collection Showcase',
    brand: 'Fashion Forward Co.',
    brandLogo: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    description: 'Looking for fashion creators to showcase our new summer collection. Must have experience with styling content and strong engagement rates.',
    budget: 500,
    deadline: '2024-02-15',
    requirements: ['Instagram Post', 'Stories', 'Reel'],
    niches: ['Fashion', 'Lifestyle'],
    platforms: ['Instagram'],
    applicationsCount: 8,
    maxCreators: 3,
    location: 'Remote',
    postedAt: '2024-01-25',
  },
  {
    id: '2',
    title: 'Tech Product Review Campaign',
    brand: 'TechCorp',
    brandLogo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    description: 'Seeking tech reviewers for our latest smartphone launch. Looking for detailed, honest reviews with high production value.',
    budget: 800,
    deadline: '2024-02-20',
    requirements: ['YouTube Video', 'Instagram Posts'],
    niches: ['Technology', 'Reviews'],
    platforms: ['YouTube', 'Instagram'],
    applicationsCount: 12,
    maxCreators: 2,
    location: 'US Only',
    postedAt: '2024-01-23',
  },
  {
    id: '3',
    title: 'Fitness Challenge Promotion',
    brand: 'HealthMax',
    brandLogo: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    description: 'Join our 30-day fitness challenge and share your journey! Perfect for fitness enthusiasts and wellness creators.',
    budget: 350,
    deadline: '2024-02-28',
    requirements: ['Instagram Posts', 'Stories', 'Progress Updates'],
    niches: ['Fitness', 'Health', 'Wellness'],
    platforms: ['Instagram', 'TikTok'],
    applicationsCount: 15,
    maxCreators: 5,
    location: 'Global',
    postedAt: '2024-01-20',
  },
  {
    id: '4',
    title: 'Travel Destination Showcase',
    brand: 'Wanderlust Travel',
    brandLogo: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    description: 'Showcase beautiful destinations in Thailand. All-expenses-paid trip included for selected creators.',
    budget: 1200,
    deadline: '2024-03-15',
    requirements: ['YouTube Vlog', 'Instagram Content', 'Blog Post'],
    niches: ['Travel', 'Photography', 'Adventure'],
    platforms: ['YouTube', 'Instagram', 'Blog'],
    applicationsCount: 25,
    maxCreators: 2,
    location: 'Thailand',
    postedAt: '2024-01-18',
  },
  {
    id: '5',
    title: 'Food Recipe Series',
    brand: 'Gourmet Kitchen',
    brandLogo: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    description: 'Create engaging recipe content featuring our premium kitchen appliances. Looking for food creators with cooking expertise.',
    budget: 600,
    deadline: '2024-02-25',
    requirements: ['Recipe Videos', 'Instagram Posts', 'Tutorials'],
    niches: ['Food', 'Cooking', 'Lifestyle'],
    platforms: ['YouTube', 'Instagram', 'TikTok'],
    applicationsCount: 9,
    maxCreators: 4,
    location: 'Remote',
    postedAt: '2024-01-22',
  },
  {
    id: '6',
    title: 'Gaming Gear Review',
    brand: 'GamePro',
    brandLogo: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    description: 'Review our latest gaming peripherals and accessories. Must be active in the gaming community.',
    budget: 450,
    deadline: '2024-02-18',
    requirements: ['Gaming Video', 'Instagram Posts', 'Live Stream'],
    niches: ['Gaming', 'Technology', 'Reviews'],
    platforms: ['Twitch', 'YouTube', 'Instagram'],
    applicationsCount: 18,
    maxCreators: 3,
    location: 'Remote',
    postedAt: '2024-01-19',
  },
];

const niches = [
  'All', 'Fashion', 'Technology', 'Fitness', 'Food', 'Travel', 
  'Gaming', 'Beauty', 'Lifestyle', 'Business', 'Education'
];

export const CampaignMarketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedNiche, setSelectedNiche] = React.useState('All');
  const [showFilters, setShowFilters] = React.useState(false);

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNiche = selectedNiche === 'All' || 
                        campaign.niches.includes(selectedNiche);
    
    return matchesSearch && matchesNiche;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Campaign Marketplace
        </h1>
        <p className="text-gray-600">
          Discover and apply to exciting brand collaborations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search campaigns, brands, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </Button>
        </div>

        {/* Niche Filter */}
        <div className="flex flex-wrap gap-2">
          {niches.map((niche) => (
            <button
              key={niche}
              onClick={() => setSelectedNiche(niche)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedNiche === niche
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {niche}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredCampaigns.length} campaigns
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="h-full">
              <div className="p-6">
                {/* Brand Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={campaign.brandLogo}
                    alt={campaign.brand}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{campaign.brand}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {new Date(campaign.postedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Campaign Title */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {campaign.title}
                </h4>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {campaign.description}
                </p>

                {/* Niches */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {campaign.niches.map((niche, idx) => (
                    <Badge key={idx} variant="info" size="sm">
                      {niche}
                    </Badge>
                  ))}
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Deliverables:</p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.requirements.map((req, idx) => (
                      <Badge key={idx} variant="default" size="sm">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <DollarSign size={16} className="mr-1" />
                    <span className="font-semibold">${campaign.budget}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-1" />
                    <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-1" />
                    <span>{campaign.applicationsCount} applied</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-1" />
                    <span className="truncate">{campaign.location}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full" size="sm">
                  Apply Now
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find more campaigns.
          </p>
        </div>
      )}
    </div>
  );
};