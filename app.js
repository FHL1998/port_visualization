import React, { useState, useEffect } from 'react';
import { ArrowRight, Truck, Clock, BarChart, TrendingUp, TrendingDown } from 'lucide-react';

const PortEnvironmentVisualization = () => {
  const [hour, setHour] = useState(8);
  const [showCongestion, setShowCongestion] = useState(false);

  const routes = [
    { name: "Gerald Desmond Bridge", baseCapacity: 4000, color: "#3498db" },
    { name: "Long Beach Gateway", baseCapacity: 6000, color: "#2ecc71" },
    { name: "Railroad", baseCapacity: 10000, color: "#e74c3c" }
  ];

  // Time factors throughout the day
  const getTimeFactor = (hour) => {
    if (hour >= 6 && hour < 10) return 2.0; // Morning rush
    if (hour >= 10 && hour < 15) return 1.0; // Midday
    if (hour >= 15 && hour < 19) return 2.5; // Evening rush
    return 0.75; // Night
  };

  // Get congestion for demonstration
  const getCongestion = (hour, route) => {
    // Simplified congestion model for visualization
    const timeFactor = getTimeFactor(hour);
    let congestion = 0;

    if (route.name === "Gerald Desmond Bridge") {
      congestion = hour >= 15 && hour < 19 ? 0.7 : (timeFactor > 1.5 ? 0.4 : 0.2);
    } else if (route.name === "Long Beach Gateway") {
      congestion = hour >= 7 && hour < 10 ? 0.6 : (timeFactor > 1.5 ? 0.5 : 0.3);
    } else {
      congestion = timeFactor > 2.0 ? 0.3 : 0.1;
    }

    return congestion;
  };

  // Get capacity with variations for demonstration
  const getCapacity = (hour, route) => {
    const timeFactor = getTimeFactor(hour);
    const congestion = getCongestion(hour, route);

    // Apply random-ish variation (±30%)
    const variation = Math.sin(hour * route.name.length) * 0.3;

    // Compute effective hourly capacity
    const hourlyBaseCapacity = route.baseCapacity / 24;
    const capacityWithVariation = hourlyBaseCapacity * (1 + variation);
    const effectiveCapacity = capacityWithVariation * (1 - congestion);

    return {
      base: hourlyBaseCapacity,
      effective: effectiveCapacity
    };
  };

  // Get demand based on time of day
  const getDemand = (hour) => {
    const baseHourlyDemand = 15000 / 24;
    const timeFactor = getTimeFactor(hour);
    const variation = Math.sin(hour * 0.7) * 0.3;

    return baseHourlyDemand * timeFactor * (1 + variation);
  };

  // Get recommended route distribution
  const getRouteDistribution = (hour) => {
    const demand = getDemand(hour);
    const congestion = {};
    let totalEffectiveCapacity = 0;

    // Calculate effective capacities
    routes.forEach(route => {
      congestion[route.name] = getCongestion(hour, route);
      const capacity = getCapacity(hour, route);
      totalEffectiveCapacity += capacity.effective;
    });

    // Calculate optimal distribution
    const distribution = {};
    routes.forEach(route => {
      const capacity = getCapacity(hour, route);
      distribution[route.name] = Math.min(1, demand / totalEffectiveCapacity) * (capacity.effective / totalEffectiveCapacity);
    });

    return distribution;
  };

  // Animation effect
  useEffect(() => {
    const timer = setInterval(() => {
      setHour(prevHour => (prevHour + 1) % 24);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Time period label
  const getTimePeriodLabel = (hour) => {
    if (hour >= 6 && hour < 10) return "Morning Rush";
    if (hour >= 10 && hour < 15) return "Midday";
    if (hour >= 15 && hour < 19) return "Evening Rush";
    return "Night";
  };

  const timeFactor = getTimeFactor(hour);
  const demand = getDemand(hour);
  const distribution = getRouteDistribution(hour);

  return (
    <div className="flex flex-col space-y-6 p-4 bg-gray-50 rounded-lg">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Port Digital Twin Model</h1>
        <div className="flex items-center justify-center mt-2">
          <Clock className="mr-2" size={20} />
          <span className="text-lg font-medium">Current Time: {hour}:00</span>
          <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
            {getTimePeriodLabel(hour)}
          </span>
        </div>
      </div>

      {/* Environment State */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Environment State</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Time Factor</div>
            <div className="text-2xl font-bold text-blue-700">{timeFactor.toFixed(1)}x</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-green-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Hourly Demand</div>
            <div className="text-2xl font-bold text-green-700">{Math.round(demand)}</div>
            <div className="text-xs text-gray-500">containers/hour</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Queue Status</div>
            <div className="flex items-center">
              <div className="h-3 w-24 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400"
                  style={{ width: `${Math.min(100, (demand/650)*100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {demand > 600 ? 'High' : demand > 300 ? 'Medium' : 'Low'}
            </div>
          </div>
        </div>
      </div>

      {/* Routes Display */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h2 className="text-xl font-semibold">Route Models</h2>
          <button
            className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={() => setShowCongestion(!showCongestion)}
          >
            {showCongestion ? "Show Capacity" : "Show Congestion"}
          </button>
        </div>

        <div className="space-y-6">
          {routes.map(route => {
            const capacity = getCapacity(hour, route);
            const congestion = getCongestion(hour, route);
            const routeDistribution = distribution[route.name];

            // Calculate usage percentage
            const usagePercentage = routeDistribution * 100;

            return (
              <div key={route.name} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 flex justify-between items-center">
                  <div className="font-medium text-lg">{route.name}</div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="px-2 py-1 rounded bg-gray-200">
                      Base: {route.baseCapacity} containers/day
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Route Visualization */}
                  <div className="relative h-16 mb-6">
                    {/* Main Road */}
                    <div className="absolute inset-0 bg-gray-200 rounded-md">
                      {/* Traffic Flow */}
                      <div
                        className="absolute top-0 bottom-0 left-0 rounded-md flex items-center justify-end transition-all duration-500"
                        style={{
                          width: `${usagePercentage}%`,
                          backgroundColor: route.color,
                          maxWidth: '100%'
                        }}
                      >
                        <div className="absolute right-0 flex items-center">
                          <Truck color="white" size={24} />
                          <ArrowRight color="white" size={16} />
                        </div>
                      </div>

                      {/* Congestion Overlay */}
                      {showCongestion && (
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-red-500 bg-opacity-40 rounded-md transition-all duration-500"
                          style={{ width: `${congestion * 100}%` }}
                        >
                          <div className="h-full flex items-center justify-center text-white font-bold">
                            {Math.round(congestion * 100)}% congestion
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route Metrics */}
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Hourly Capacity</div>
                      <div className="font-semibold">{Math.round(capacity.base)} containers</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Effective Capacity</div>
                      <div className="font-semibold">{Math.round(capacity.effective)} containers</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Congestion</div>
                      <div className="font-semibold">{(congestion * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-gray-500">Allocation</div>
                      <div className="font-semibold">{usagePercentage.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Trends */}
                <div className="flex border-t">
                  <div className="flex-1 p-2 flex items-center justify-center">
                    <div className={`flex items-center ${congestion > 0.5 ? 'text-red-500' : 'text-gray-500'}`}>
                      {congestion > 0.5 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span className="ml-1 text-sm">Congestion</span>
                    </div>
                  </div>
                  <div className="border-l"></div>
                  <div className="flex-1 p-2 flex items-center justify-center">
                    <div className={`flex items-center ${usagePercentage > 70 ? 'text-green-500' : 'text-gray-500'}`}>
                      {usagePercentage > 70 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span className="ml-1 text-sm">Utilization</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RL Agent Action */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Reinforcement Learning Agent Actions</h2>
        <div className="space-y-3">
          {routes.map(route => {
            const routeDistribution = distribution[route.name];
            // Convert to discrete action (0-4)
            const action = Math.min(4, Math.floor(routeDistribution * 5));

            return (
              <div key={route.name} className="flex items-center">
                <div className="w-48 text-sm">{route.name}:</div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map(index => (
                      <div
                        key={index}
                        className={`flex-1 h-8 rounded flex items-center justify-center text-sm ${
                          index === action 
                            ? 'bg-blue-500 text-white font-medium' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {index * 25}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-yellow-50 p-3 rounded-md text-sm">
          <div className="font-medium mb-1">Agent Strategy:</div>
          <p>
            {hour >= 15 && hour < 19
              ? "During evening rush, allocate more traffic to Railroad to reduce congestion on bridges"
              : hour >= 6 && hour < 10
              ? "During morning rush, balance traffic across all routes with preference for higher capacity routes"
              : "During normal hours, optimize for throughput while maintaining low congestion levels"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortEnvironmentVisualization;