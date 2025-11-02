/*import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FaUser, FaLock, FaHardHat, FaBuilding } from "react-icons/fa";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(true);
  const { login, sendMagicLink } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Logged in successfully",
        description: "Welcome back to BuildSmart!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMagicLink(magicEmail);
      toast({
        title: "Magic link sent",
        description: "Check your email to finish signing in.",
      });
    } catch (error) {
      toast({
        title: "Error sending magic link",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 relative overflow-hidden">
      {/* Construction-themed background elements *}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-6xl text-orange-400">
          <FaBuilding />
        </div>
        <div className="absolute top-40 right-20 text-5xl text-blue-400">
          <FaHardHat />
        </div>
        <div className="absolute bottom-20 left-1/4 text-4xl text-yellow-400">
          <FaBuilding />
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full mb-4">
            <FaHardHat className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your BuildSmart account</p>
        </div>

        {showPasswordLogin ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-600 text-white rounded-lg hover:from-orange-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email Address for Magic Link"
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Send Magic Link
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowPasswordLogin(!showPasswordLogin)}
            className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
          >
            {showPasswordLogin ? "Use Magic Link Instead" : "Use Password Instead"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; */
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  FaUser, FaLock, FaHardHat, FaBuilding, FaTools,
  FaGoogle, FaGithub, FaApple
} from "react-icons/fa";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  const { login, sendMagicLink, signInWithGoogle, signInWithGithub, signInWithApple } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Logged in successfully",
        description: "Welcome back to BuildSmart!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMagicLink(magicEmail);
      toast({
        title: "Magic link sent",
        description: "Check your email to finish signing in.",
      });
    } catch (error) {
      toast({
        title: "Error sending magic link",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 relative overflow-hidden">
      {/* Construction-themed background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-16 left-16 text-5xl text-blue-400">
          <FaTools />
        </div>
        <div className="absolute top-32 right-12 text-6xl text-green-400">
          <FaBuilding />
        </div>
        <div className="absolute bottom-24 left-1/3 text-4xl text-yellow-400">
          <FaHardHat />
        </div>
        <div className="absolute bottom-16 right-16 text-5xl text-blue-400">
          <FaBuilding />
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-green-600 rounded-full mb-4">
            <FaHardHat className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your BuildSmart account</p>
        </div>

        {/* Social Logins */}
        <div className="space-y-3 mb-6">
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition"
          >
            <FaGoogle className="mr-2 text-red-500" /> Continue with Google
          </button>
          <button
            onClick={signInWithGithub}
            className="w-full py-3 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition"
          >
            <FaGithub className="mr-2 text-gray-800" /> Continue with GitHub
          </button>
          <button
            onClick={signInWithApple}
            className="w-full py-3 flex items-center justify-center border rounded-lg hover:bg-gray-50 transition"
          >
            <FaApple className="mr-2 text-black" /> Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Magic Link */}
        <form onSubmit={handleMagicLink} className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Enter your email for magic link"
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Send Magic Link
          </button>
        </form>

        {/* Email & Password Login */}
        {showPasswordLogin ? (
          <form onSubmit={handleSubmit} className="space-y-6 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-600 text-white rounded-lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <div className="text-center mb-6">
            <button
              onClick={() => setShowPasswordLogin(true)}
              className="text-blue-600 hover:underline"
            >
              Use email & password instead
            </button>
          </div>
        )}

        {/* Links */}
        <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
          <p>
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
          <p>
            <Link to="/reset-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </p>
          <p>
            <Link to="/terms" className="text-gray-500 hover:underline">
              Terms
            </Link>{" "}
            &{" "}
            <Link to="/privacy" className="text-gray-500 hover:underline">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

