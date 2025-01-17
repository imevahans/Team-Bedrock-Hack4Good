import React, { useRef, useEffect } from "react";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/WeeklyRequestsChart.css";

// Register required components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklyRequestsChart = ({ data }) => {
  const chartRef = useRef();

  useEffect(() => {
    // Cleanup existing chart instance to avoid canvas reuse issues
    return () => {
      if (chartRef.current && chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }
    };
  }, []);

  // Aggregate purchases by product
  const aggregatedData = data.reduce((acc, item) => {
    if (!acc[item.productName]) {
      acc[item.productName] = { productName: item.productName, totalQuantity: 0 };
    }
    acc[item.productName].totalQuantity += item.quantity;
    return acc;
  }, {});

  const chartData = {
    labels: Object.values(aggregatedData).map((item) => item.productName),
    datasets: [
      {
        label: "Total Purchased",
        data: Object.values(aggregatedData).map((item) => item.totalQuantity),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Export chart to PDF
  const handleExportPDF = async () => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current.firstChild); // Capture the chart as an image
      const chartImage = canvas.toDataURL("image/png");

      const pdf = new jsPDF();
      pdf.text("Weekly Requests Report", 14, 10);
      pdf.addImage(chartImage, "PNG", 10, 20, 190, 90); // Adjust dimensions as needed
      pdf.save("weekly_requests_report.pdf");
    }
  };

  return (
    <div className="chart-container">
      <div ref={chartRef}>
        <Bar data={chartData} />
      </div>
      <button onClick={handleExportPDF}>Export Chart to PDF</button>
    </div>
  );
};

export default WeeklyRequestsChart;
