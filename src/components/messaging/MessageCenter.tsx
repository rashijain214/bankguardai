import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Send, 
  Paperclip, 
  Mic,
  MoreVertical,
  Phone,
  Video,
  Star
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

const mockConversations = [
  {
    id: '1',
    name: 'Sarah Johnson (Creator)',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    lastMessage: 'Thanks for the opportunity! When do you need the final deliverables?',
    timestamp: '2 min ago',
    unread: 2,
    campaign: 'Summer Fashion Collection',
    online: true,
  },
  {
    id: '2',
    name: 'TechCorp (Brand)',
    avatar: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    lastMessage: 'We love your proposal! Let\'s discuss the timeline.',
    timestamp: '1 hour ago',
    unread: 0,
    campaign: 'Tech Product Review',
    online: false,
  },
  {
    id: '3',
    name: 'Mike Chen (Creator)',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    lastMessage: 'I\'ve uploaded the first draft. Please review and let me know!',
    timestamp: '3 hours ago',
    unread: 1,
    campaign: 'Gaming Gear Review',
    online: true,
  },
  {
    id: '4',
    name: 'Fashion Forward Co. (Brand)',
    avatar: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2',
    lastMessage: 'Great work on the content! Payment has been processed.',
    timestamp: '1 day ago',
    unread: 0,
    campaign: 'Spring Collection Launch',
    online: false,
  },
];

const mockMessages = [
  {
    id: '1',
    senderId: '2',
    content: 'Hi Sarah! We reviewed your application and we\'re impressed with your portfolio.',
    timestamp: '10:30 AM',
    type: 'text',
  },
  {
    id: '2',
    senderId: '1',
    content: 'Thank you so much! I\'m really excited about this collaboration opportunity.',
    timestamp: '10:32 AM',
    type: 'text',
  },
  {
    id: '3',
    senderId: '2',
    content: 'We\'d like to move forward with you for our Summer Fashion Collection campaign. Are you available for a quick call this week?',
    timestamp: '10:35 AM',
    type: 'text',
  },
  {
    id: '4',
    senderId: '1',
    content: 'Absolutely! I\'m free Tuesday or Wednesday afternoon. What works best for you?',
    timestamp: '10:37 AM',
    type: 'text',
  },
  {
    id: '5',
    senderId: '2',
    content: 'Perfect! Let\'s schedule for Tuesday at 2 PM. I\'ll send you the campaign brief beforehand.',
    timestamp: '10:40 AM',
    type: 'text',
  },
  {
    id: '6',
    senderId: '1',
    content: 'Thanks for the opportunity! When do you need the final deliverables?',
    timestamp: '2 min ago',
    type: 'text',
  },
];

export const MessageCenter: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = React.useState(mockConversations[0]);
  const [message, setMessage] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.campaign.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with brands and creators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-gray-200">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>
          
          <div className="overflow-y-auto h-full">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedConversation.id === conversation.id ? 'bg-purple-50 border-purple-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {conversation.timestamp}
                      </span>
                    </div>
                    
                    <p className="text-xs text-purple-600 mb-1">
                      {conversation.campaign}
                    </p>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  
                  {conversation.unread > 0 && (
                    <Badge variant="danger" size="sm">
                      {conversation.unread}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {selectedConversation.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.name}
                </h3>
                <p className="text-sm text-purple-600">
                  {selectedConversation.campaign}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Phone size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <Video size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <Star size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.senderId === '1' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.senderId === '1'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === '1' ? 'text-purple-200' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <Mic size={16} />
              </Button>
              <div className="flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};