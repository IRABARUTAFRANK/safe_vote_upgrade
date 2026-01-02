"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ElectionPerformanceChartProps {
  data: Array<{ 
    name: string; 
    votes: number; 
    positions: number;
    status: string;
  }>;
}

export default function ElectionPerformanceChart({ data }: ElectionPerformanceChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}>
          <p style={{ color: "#f1f5f9", margin: "0 0 4px", fontWeight: 600 }}>
            {data.name}
          </p>
          <p style={{ color: "#3b82f6", margin: "4px 0" }}>
            Votes: {data.votes}
          </p>
          <p style={{ color: "#10b981", margin: "4px 0" }}>
            Positions: {data.positions}
          </p>
          <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: "0.85rem" }}>
            Status: {data.status}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "300px",
        color: "#64748b",
        fontSize: "0.9rem",
      }}>
        No election performance data available
      </div>
    );
  }

  // Limit to top 10 for better visualization
  const displayData = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          stroke="#94a3b8"
          style={{ fontSize: "0.75rem" }}
        />
        <YAxis 
          stroke="#94a3b8"
          style={{ fontSize: "0.75rem" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: "#94a3b8", fontSize: "0.85rem", paddingTop: "20px" }}
        />
        <Bar dataKey="votes" fill="#3b82f6" name="Votes Cast" radius={[8, 8, 0, 0]} />
        <Bar dataKey="positions" fill="#10b981" name="Positions" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

