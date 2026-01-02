"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface VotesTimelineChartProps {
  data: Array<{ date: string; votes: number }>;
}

export default function VotesTimelineChart({ data }: VotesTimelineChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}>
          <p style={{ color: "#f1f5f9", margin: "0 0 4px", fontWeight: 600 }}>
            {payload[0].payload.date}
          </p>
          <p style={{ color: "#3b82f6", margin: 0 }}>
            Votes: {payload[0].value}
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
        No voting activity in the last 30 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8"
          style={{ fontSize: "0.75rem" }}
        />
        <YAxis 
          stroke="#94a3b8"
          style={{ fontSize: "0.75rem" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="votes" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill="url(#colorVotes)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

