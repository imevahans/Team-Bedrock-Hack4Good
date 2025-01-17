import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklyRequestsChart = ({ data }) => {
  const chartData = {
    labels: data.map((request) => request.productName),
    datasets: [
      {
        label: "Requests",
        data: data.map((request) => request.quantity),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return <Bar data={chartData} />;
};

export default WeeklyRequestsChart;
