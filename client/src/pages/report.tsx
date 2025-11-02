import React from "react";
import { useRoute } from "wouter";

const Report: React.FC = () => {
  const [, params] = useRoute("/report/:id");
  const reportId = params?.id;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">Report Page</h1>
      <p>Report ID: {reportId}</p>
    </div>
  );
};

export default Report;