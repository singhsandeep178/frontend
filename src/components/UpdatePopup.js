import React, { useEffect, useState } from "react";

const UpdatePopup = () => {
  const customerId = process.env.REACT_APP_OTA_CUSTOMER_ID;
  const [showPopup, setShowPopup] = useState(false);
  const [updateType, setUpdateType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    const checkForUpdate = async () => {
      if (!customerId) {
        console.error("Customer OTA ID is not set in environment variables (REACT_APP_OTA_CUSTOMER_ID).");
        return;
      }

      try {
        const otaBackendUrl = process.env.REACT_APP_OTA_BACKEND_URL || 'https://crm-based-cms-backend.onrender.com';
        const res = await fetch(`${otaBackendUrl}/api/ota/check-update-status?customerId=${customerId}`);

        if (!res.ok) {
          console.error(`API error checking update status: ${res.status} ${res.statusText}`);
          try {
            const errorData = await res.json();
            console.error("Error details:", errorData);
          } catch (e) {
            // Ignore if response is not JSON
          }
          return;
        }

        const data = await res.json();
        if (data.updateAvailable) {
          setShowPopup(true);
          setUpdateType(data.updateType);
        }
      } catch (err) {
        console.error("Failed to check for updates (Network/CORS issue?):", err);
        setMessage("Could not check for updates. Please check console for errors.");
      }
    };

    // Check for updates immediately when component mounts
    checkForUpdate();

    // Set up polling to check for updates every 30 seconds
    const pollingInterval = setInterval(() => {
      checkForUpdate();
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, [customerId]);

  const handleUpdateNow = async () => {
    if (!customerId || !updateType) return;

    setShowPopup(false);
    setShowWarningPopup(true);
    setLoading(true);
    setMessage("");
    setUpdateProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const otaBackendUrl = process.env.REACT_APP_OTA_BACKEND_URL || 'https://crm-based-cms-backend.onrender.com';

      const res = await fetch(
        `${otaBackendUrl}/api/ota/push-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customerId, updateType }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        clearInterval(progressInterval);
        setUpdateProgress(100);
        setMessage("Update completed successfully! Reloading...");

        // Wait 2 seconds then reload the page
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        clearInterval(progressInterval);
        setMessage(`Error: ${data.error || data.message || "Update failed. Check console."}`);
        console.error("Update push failed:", data);
        setTimeout(() => {
          setShowWarningPopup(false);
          setLoading(false);
        }, 3000);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setMessage("Network error occurred during update push.");
      console.error("Network error during update push:", err);
      setTimeout(() => {
        setShowWarningPopup(false);
        setLoading(false);
      }, 3000);
    }
  };

  // Warning Popup during update
  if (showWarningPopup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-[90%] max-w-lg text-center transform transition-all">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Software Update in Progress</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your software is being updated. This may take a few moments. Please do not refresh or close this window, otherwise the update will fail.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${updateProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{updateProgress}% Complete</p>
          </div>

          {/* Loading Spinner */}
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>

          {message && (
            <p className={`mt-4 text-sm font-medium ${message.includes('Error') || message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main Update Available Popup
  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-[90%] max-w-md text-center transform transition-all scale-100 hover:scale-105 duration-300">
        {/* Icon Section */}
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">New Update Available!</h2>
          <p className="text-gray-600 mb-2">
            A new update for <span className="font-semibold text-blue-600 capitalize">'{updateType}'</span> is ready to install.
          </p>
          <p className="text-sm text-gray-500">
            Stay up to date with the latest features and improvements.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="space-y-3">
          <button
            onClick={handleUpdateNow}
            disabled={loading}
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform transition-all duration-200 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              "Update Now"
            )}
          </button>

          <button
            onClick={() => setShowPopup(false)}
            disabled={loading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Maybe Later
          </button>
        </div>

        {message && (
          <p className={`mt-4 text-sm font-medium ${message.startsWith('Could not') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default UpdatePopup;
