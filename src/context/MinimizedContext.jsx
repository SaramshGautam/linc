// ############# LAST WORKING #############

import React, { createContext, useState } from "react";

export const MinimizedContext = createContext();

// export const MinimizedProvider = ({ children }) => {
//   const [minimizedComponents, setMinimizedComponents] = useState([
//     { key: "transcript", isActive: false },
//     { key: "multi-transcript", isActive: false },
//     { key: "streamgraph", isActive: false },
//     { key: "post-transcript", isActive: false },
//     { key: "radar", isActive: false },
//     { key: "summary", isActive: false },
//   ]);

export const MinimizedProvider = ({ children }) => {
  const [minimizedComponents, setMinimizedComponents] = useState([
    { key: "post-transcript", isActive: true, dashboardKey: "post-meeting" },
    { key: "summary", isActive: true, dashboardKey: "post-meeting" },
    { key: "streamgraph", isActive: true, dashboardKey: "post-meeting" },
    { key: "radar", isActive: true, dashboardKey: "post-meeting" },
    { key: "actions", isActive: true, dashboardKey: "post-meeting" },
    { key: "chord", isActive: true, dashboardKey: "post-meeting" },
    { key: "audio", isActive: true, dashboardKey: "post-meeting" },

    { key: "transcript", isActive: true, dashboardKey: "real-time" },
    { key: "multi-transcript", isActive: true, dashboardKey: "real-time" },
    { key: "speak", isActive: true, dashboardKey: "real-time" },
    { key: "multi-speak", isActive: true, dashboardKey: "real-time" },
  ]);

  const toggleComponent = (key) => {
    setMinimizedComponents((prev) => {
      const existingComponent = prev.find((item) => item.key === key);
      if (existingComponent) {
        return prev.map((item) =>
          item.key === key ? { ...item, isActive: !item.isActive } : item
        );
      } else {
        return [...prev, { key, isActive: true }];
      }
    });
  };

  // return (
  //   <MinimizedContext.Provider
  //     value={{ minimizedComponents, setMinimizedComponents, toggleComponent }}
  //   >
  //     {children}
  //   </MinimizedContext.Provider>
  // );

  return (
    <MinimizedContext.Provider value={{ minimizedComponents, toggleComponent }}>
      {children}
    </MinimizedContext.Provider>
  );
};
