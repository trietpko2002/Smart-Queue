using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace SmartQueueLauncher
{
    static class Program
    {
        private static NotifyIcon trayIcon;
        private static ContextMenuStrip trayMenu;
        private static Process serverProcess = null;
        private static string appUrl = "http://localhost:3000";

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Set current directory to executable location
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            Directory.SetCurrentDirectory(baseDir);

            // 1. Check & Start Node backend server if port 3000 is not already running
            if (!IsPortInUse(3000))
            {
                StartServer(baseDir);
            }

            // 2. Wait for server to become responsive
            WaitForServerReady(15);

            // 3. Launch App Window
            OpenAppWindow("/");

            // 4. Initialize System Tray Icon
            InitTrayIcon(baseDir);

            // Keep application alive in tray until user exits
            Application.Run();
        }

        private static bool IsPortInUse(int port)
        {
            try
            {
                using (var tcpClient = new TcpClient())
                {
                    var result = tcpClient.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(800);
                    if (success && tcpClient.Connected)
                    {
                        tcpClient.EndConnect(result);
                        return true;
                    }
                }
            }
            catch { }
            return false;
        }

        private static void StartServer(string baseDir)
        {
            try
            {
                string serverScript = Path.Combine(baseDir, "dist", "server.cjs");
                string cmdArgs;

                if (File.Exists(serverScript))
                {
                    cmdArgs = "/c node dist/server.cjs";
                }
                else
                {
                    cmdArgs = "/c npx tsx server.ts";
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = cmdArgs,
                    WorkingDirectory = baseDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                serverProcess = Process.Start(startInfo);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Không thể khởi động máy chủ Smart Queue:\n" + ex.Message, "Lỗi Smart Queue", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void WaitForServerReady(int maxSeconds)
        {
            for (int i = 0; i < maxSeconds; i++)
            {
                if (IsPortInUse(3000)) return;
                Thread.Sleep(800);
            }
        }

        private static void OpenAppWindow(string path)
        {
            string targetUrl = appUrl + path;
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgePath))
            {
                edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chromePath))
            {
                chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            }

            try
            {
                if (File.Exists(edgePath))
                {
                    Process.Start(edgePath, string.Format("--app=\"{0}\" --window-size=1366,850", targetUrl));
                    return;
                }

                if (File.Exists(chromePath))
                {
                    Process.Start(chromePath, string.Format("--app=\"{0}\" --window-size=1366,850", targetUrl));
                    return;
                }

                // Fallback to default browser
                Process.Start(targetUrl);
            }
            catch (Exception ex)
            {
                Process.Start(targetUrl);
            }
        }

        private static void InitTrayIcon(string baseDir)
        {
            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("🖥️ Mở Trang Chủ", null, (s, e) => OpenAppWindow("/"));
            trayMenu.Items.Add("📱 Kiosk Lấy Số (/kiosk)", null, (s, e) => OpenAppWindow("/kiosk"));
            trayMenu.Items.Add("📺 Màn Hình TV (/tv)", null, (s, e) => OpenAppWindow("/tv"));
            trayMenu.Items.Add("👨‍💼 Bàn Cán Bộ (/staff)", null, (s, e) => OpenAppWindow("/staff"));
            trayMenu.Items.Add("⚙️ Quản Trị Hệ Thống (/admin)", null, (s, e) => OpenAppWindow("/admin"));
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add("🌐 Kích hoạt Public Link (Cloudflare)", null, (s, e) => {
                string scriptPath = Path.Combine(baseDir, "scripts", "setup-cloudflare-tunnel.bat");
                if (File.Exists(scriptPath))
                {
                    Process.Start(new ProcessStartInfo("cmd.exe", "/c \"" + scriptPath + "\"") { UseShellExecute = true });
                }
            });
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add("❌ Thoát Hoàn Toàn", null, (s, e) => ExitApp());

            // Create tray icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Smart Queue 2.0 - Đang hoạt động";
            trayIcon.ContextMenuStrip = trayMenu;

            // System default application icon or custom
            trayIcon.Icon = SystemIcons.Application;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => OpenAppWindow("/");
        }

        private static void ExitApp()
        {
            try
            {
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }

                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch { }

            Application.Exit();
            Environment.Exit(0);
        }
    }
}
