import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface AuthFormProps {
  type: 'signin' | 'signup';
}

interface FormData {
  email: string;
  password: string;
  fullName?: string;
  role?: 'creator' | 'brand';
}

export const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      if (type === 'signin') {
        await signIn(data.email, data.password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        await signUp(data.email, data.password, data.fullName!, data.role!);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl w-fit mx-auto mb-4">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {type === 'signin' ? 'Welcome Back' : 'Join CollabConnect'}
          </h2>
          <p className="text-gray-600 mt-2">
            {type === 'signin' 
              ? 'Sign in to your account to continue' 
              : 'Create your account and start collaborating'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {type === 'signup' && (
            <>
              <Input
                label="Full Name"
                type="text"
                icon={<User size={20} />}
                placeholder="Enter your full name"
                {...register('fullName', { 
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                error={errors.fullName?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['creator', 'brand'].map((role) => (
                    <label
                      key={role}
                      className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedRole === role
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={role}
                        {...register('role', { required: 'Please select your role' })}
                        className="sr-only"
                      />
                      <div className="text-center">
                        {role === 'creator' ? (
                          <User className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        ) : (
                          <Building2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {role}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            icon={<Mail size={20} />}
            placeholder="Enter your email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            icon={<Lock size={20} />}
            placeholder="Enter your password"
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            error={errors.password?.message}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            size="lg"
          >
            {type === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {type === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <Link
              to={type === 'signin' ? '/auth/signup' : '/auth/signin'}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {type === 'signin' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};