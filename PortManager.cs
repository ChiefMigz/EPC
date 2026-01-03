using System;
using System.Net;
using System.Net.NetworkInformation;
using System.Diagnostics;
using System.IO;

namespace ExternalPoliceComputer
{
    public static class PortManager
    {
        private static readonly int[] PREFERRED_PORTS = { 8080, 8081, 8082, 8083, 8084, 8085 };
        private static readonly string LOG_FILE = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "EPC_Port.log");
        
        /// <summary>
        /// Finds an available port, starting with 8080 and trying alternatives
        /// </summary>
        /// <returns>An available port number, or -1 if none found</returns>
        public static int FindAvailablePort()
        {
            LogMessage("Starting port search...");
            
            foreach (int port in PREFERRED_PORTS)
            {
                if (IsPortAvailable(port))
                {
                    LogMessage($"Port {port} is available - using this port");
                    return port;
                }
                else
                {
                    LogMessage($"Port {port} is in use - trying next port");
                }
            }
            
            LogMessage("No preferred ports available, searching for any available port...");
            
            // If no preferred ports are available, find any available port in range 8086-8199
            for (int port = 8086; port <= 8199; port++)
            {
                if (IsPortAvailable(port))
                {
                    LogMessage($"Found available port: {port}");
                    return port;
                }
            }
            
            LogMessage("ERROR: No available ports found in range 8080-8199");
            return -1;
        }
        
        /// <summary>
        /// Checks if a port is available for use
        /// </summary>
        /// <param name="port">Port number to check</param>
        /// <returns>True if port is available, false otherwise</returns>
        public static bool IsPortAvailable(int port)
        {
            try
            {
                // Check if port is in use by any TCP connections
                IPGlobalProperties ipGlobalProperties = IPGlobalProperties.GetIPGlobalProperties();
                IPEndPoint[] tcpConnInfoArray = ipGlobalProperties.GetActiveTcpListeners();
                
                foreach (IPEndPoint endpoint in tcpConnInfoArray)
                {
                    if (endpoint.Port == port)
                    {
                        return false;
                    }
                }
                
                // Check URL reservations using netsh
                if (HasUrlReservation(port))
                {
                    // Try to clear the reservation
                    if (ClearUrlReservation(port))
                    {
                        LogMessage($"Cleared existing URL reservation for port {port}");
                        return true;
                    }
                    return false;
                }
                
                return true;
            }
            catch (Exception ex)
            {
                LogMessage($"Error checking port {port}: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Checks if a port has a URL reservation
        /// </summary>
        /// <param name="port">Port to check</param>
        /// <returns>True if port has URL reservation</returns>
        private static bool HasUrlReservation(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "netsh",
                    Arguments = "http show urlacl",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };
                
                using (Process process = Process.Start(psi))
                {
                    string output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();
                    
                    // Check for both http://+:port/ and http://*:port/ patterns
                    return output.Contains($"http://+:{port}/") || 
                           output.Contains($"http://*:{port}/");
                }
            }
            catch
            {
                return false;
            }
        }
        
        /// <summary>
        /// Attempts to clear URL reservation for a port
        /// </summary>
        /// <param name="port">Port to clear reservation for</param>
        /// <returns>True if successful or no reservation existed</returns>
        private static bool ClearUrlReservation(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "netsh",
                    Arguments = $"http delete urlacl url=http://+:{port}/",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
                
                using (Process process = Process.Start(psi))
                {
                    process.WaitForExit();
                    return process.ExitCode == 0;
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Failed to clear URL reservation for port {port}: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Starts HTTP listener with automatic port fallback
        /// </summary>
        /// <param name="listener">HttpListener instance</param>
        /// <returns>Port number used, or -1 if failed</returns>
        public static int StartListenerWithPortFallback(HttpListener listener)
        {
            int port = FindAvailablePort();
            
            if (port == -1)
            {
                LogMessage("CRITICAL: No available ports found - cannot start server");
                return -1;
            }
            
            try
            {
                string prefix = $"http://+:{port}/";
                listener.Prefixes.Clear();
                listener.Prefixes.Add(prefix);
                listener.Start();
                
                LogMessage($"SUCCESS: HTTP Listener started on port {port}");
                return port;
            }
            catch (Exception ex)
            {
                LogMessage($"FAILED to start HTTP Listener on port {port}: {ex.Message}");
                
                // Try one more time with a different port
                if (port != 8080)
                {
                    LogMessage("Attempting fallback port...");
                    return StartListenerWithPortFallback(listener);
                }
                
                return -1;
            }
        }
        
        /// <summary>
        /// Logs messages to file and console
        /// </summary>
        /// <param name="message">Message to log</param>
        private static void LogMessage(string message)
        {
            string logEntry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}";
            
            try
            {
                File.AppendAllText(LOG_FILE, logEntry + Environment.NewLine);
            }
            catch
            {
                // Ignore file write errors
            }
            
            Console.WriteLine($"[EPC PortManager] {message}");
        }
        
        /// <summary>
        /// Gets the port configuration file path
        /// </summary>
        /// <returns>Path to port config file</returns>
        public static string GetPortConfigPath()
        {
            string appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            return Path.Combine(appDataPath, "EPC_Port.txt");
        }
        
        /// <summary>
        /// Saves the current port to config file for client-side apps
        /// </summary>
        /// <param name="port">Port number to save</param>
        public static void SavePortConfig(int port)
        {
            try
            {
                File.WriteAllText(GetPortConfigPath(), port.ToString());
                LogMessage($"Saved port {port} to config file");
            }
            catch (Exception ex)
            {
                LogMessage($"Failed to save port config: {ex.Message}");
            }
        }
        
        /// <summary>
        /// Reads the current port from config file
        /// </summary>
        /// <returns>Port number, or 8080 if config doesn't exist</returns>
        public static int LoadPortConfig()
        {
            try
            {
                string configPath = GetPortConfigPath();
                if (File.Exists(configPath))
                {
                    string portText = File.ReadAllText(configPath).Trim();
                    if (int.TryParse(portText, out int port))
                    {
                        return port;
                    }
                }
            }
            catch
            {
                // Ignore errors, use default
            }
            
            return 8080; // Default port
        }
    }
}