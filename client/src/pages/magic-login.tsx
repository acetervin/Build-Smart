import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FaHardHat } from "react-icons/fa";

const MagicLogin: React.FC = () => {
  const [, setLocation] = useLocation();
  const { verifyMagicLink } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      verifyMagicLink(token)
        .then(() => {
          toast({
            title: "Logged in successfully",
            description: "Welcome to BuildSmart!",
          });
          setLocation("/dashboard");
        })
        .catch((error) => {
          toast({
            title: "Invalid magic link",
            description: "The link is invalid or expired.",
            variant: "destructive",
          });
          setLocation("/login");
        });
    } else {
      setLocation("/login");
    }
  }, [verifyMagicLink, setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full mb-4">
          <FaHardHat className="text-white text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we verify your magic link.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default MagicLogin;
