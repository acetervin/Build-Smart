import { Link } from "wouter";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Welcome to BuildSmart</h1>
      <p className="text-lg text-gray-600 mb-6">
        Manage your construction projects easily with our smart tools.
      </p>
      <div className="flex gap-4">
        <Link
          to="/signup"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Sign Up
        </Link>
        <Link
          to="/login"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Login
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
