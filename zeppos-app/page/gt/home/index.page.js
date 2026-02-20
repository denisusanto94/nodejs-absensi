import * as hmUI from "@zos/ui";
import { Geolocation } from "@zos/sensor";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { Time } from "@zos/sensor";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

Page({
  state: {
    lat: 0,
    lon: 0,
    accuracy: 0,
    inputCode: "",
    gpsReady: false,
    userName: "",
    lastScanTime: 0,
    groupGPS: null,
    groupInput: null,
    groupDashboard: null,
    txtInput: null
  },

  onInit() {
    console.log("OnInit");
    hmUI.setStatusBarVisible(false);
  },

  build() {
    // 1. GPS Screen
    this.createGPSScreen();

    // 2. Input Screen
    this.createInputScreen();

    // 3. Dashboard Screen
    this.createDashboardScreen();

    // Initial State: GPS Scanning
    this.showScreen("GPS");
    this.startGPS();
  },

  onDestroy() {
    if (this.geolocation) {
      this.geolocation.stop();
    }
    if (this.state.timer) {
      clearInterval(this.state.timer);
    }
  },

  createGPSScreen() {
    this.state.groupGPS = hmUI.createWidget(hmUI.widget.GROUP, {
      x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT
    });

    this.state.groupGPS.createWidget(hmUI.widget.TEXT, {
      x: px(25),
      y: 0,
      w: DEVICE_WIDTH - px(50),
      h: DEVICE_HEIGHT,
      text: "Scanning GPS...\nPlease go outdoors.",
      text_size: px(30),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
  },

  createInputScreen() {
    this.state.groupInput = hmUI.createWidget(hmUI.widget.GROUP, {
      x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT
    });

    // Input Display
    this.state.txtInput = this.state.groupInput.createWidget(hmUI.widget.TEXT, {
      x: px(25),
      y: px(20),
      w: DEVICE_WIDTH - px(50),
      h: px(50),
      text: "Enter Code",
      text_size: px(32),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    // Keypad Layout
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "OK"];
    const startY = px(80);
    const margin = px(25);
    const gap = px(10);
    const btnW = (DEVICE_WIDTH - margin * 2 - gap * 2) / 3;
    const btnH = px(60);

    keys.forEach((key, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;

      this.state.groupInput.createWidget(hmUI.widget.BUTTON, {
        x: margin + col * (btnW + gap),
        y: startY + row * btnH,
        w: btnW,
        h: btnH - px(4),
        text: key,
        color: 0x000000,
        normal_color: 0xffffff,
        press_color: 0xe0e0e0,
        radius: px(12),
        click_func: () => {
          this.handleInput(key);
        }
      });
    });
  },

  createDashboardScreen() {
    this.state.groupDashboard = hmUI.createWidget(hmUI.widget.GROUP, {
      x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT
    });

    const labelX = px(25);
    const startY = px(20);

    // Time (24H)
    this.state.lblTime = this.state.groupDashboard.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: startY, w: DEVICE_WIDTH - labelX * 2, h: px(35),
      text: "--:--:--",
      text_size: px(26),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H // Time looks best centered
    });

    // Date (DD/MM/YYYY)
    this.state.lblDate = this.state.groupDashboard.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: startY + px(35), w: DEVICE_WIDTH - labelX * 2, h: px(35),
      text: "--/--/----",
      text_size: px(26),
      color: 0xcccccc,
      align_h: hmUI.align.CENTER_H
    });

    const infoY = startY + px(80); // Start user info lower
    const gap = px(35); // Reduce gap slightly to fit everything

    // Name
    this.state.lblName = this.state.groupDashboard.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: infoY, w: DEVICE_WIDTH - labelX * 2, h: px(35),
      text: "User: -",
      text_size: px(26),
      color: 0xffffff,
      align_h: hmUI.align.LEFT
    });

    // Latitude
    this.state.lblLat = this.state.groupDashboard.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: infoY + gap, w: DEVICE_WIDTH - labelX * 2, h: px(35),
      text: "Latitude: -",
      text_size: px(26),
      color: 0xffffff,
      align_h: hmUI.align.LEFT
    });

    // Longitude
    this.state.lblLon = this.state.groupDashboard.createWidget(hmUI.widget.TEXT, {
      x: labelX, y: infoY + gap * 2, w: DEVICE_WIDTH - labelX * 2, h: px(35),
      text: "Longitude: -",
      text_size: px(26),
      color: 0xffffff,
      align_h: hmUI.align.LEFT
    });

    const btnMargin = px(25);
    const btnGap = px(15);
    const btnWidth = (DEVICE_WIDTH - btnMargin * 2 - btnGap) / 2;
    const btnY = infoY + gap * 3.5;

    // Check In Button (Left)
    this.state.groupDashboard.createWidget(hmUI.widget.BUTTON, {
      x: btnMargin,
      y: btnY,
      w: btnWidth,
      h: px(60),
      text: "CHECK IN",
      color: 0x000000,
      normal_color: 0xffffff,
      press_color: 0xe0e0e0,
      radius: px(12),
      click_func: () => {
        this.performCheck("IN");
      }
    });

    // Check Out Button (Right)
    this.state.groupDashboard.createWidget(hmUI.widget.BUTTON, {
      x: btnMargin + btnWidth + btnGap,
      y: btnY,
      w: btnWidth,
      h: px(60),
      text: "CHECK OUT",
      color: 0x000000,
      normal_color: 0xffffff,
      press_color: 0xe0e0e0,
      radius: px(12),
      click_func: () => {
        this.performCheck("OUT");
      }
    });

    // Start Timer
    this.updateTime();
    this.state.timer = setInterval(() => {
      this.updateTime();
    }, 1000);
  },

  updateTime() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    if (this.state.lblTime) this.state.lblTime.setProperty(hmUI.prop.TEXT, timeStr);
    if (this.state.lblDate) this.state.lblDate.setProperty(hmUI.prop.TEXT, dateStr);
  },

  showScreen(name) {
    this.state.groupGPS.setProperty(hmUI.prop.VISIBLE, name === "GPS");
    this.state.groupInput.setProperty(hmUI.prop.VISIBLE, name === "INPUT");
    this.state.groupDashboard.setProperty(hmUI.prop.VISIBLE, name === "DASHBOARD");
  },

  startGPS() {
    this.geolocation = new Geolocation();
    this.geolocation.start();

    // The correct pattern for Zepp OS Geolocation is often event listener or callback
    this.geolocation.onChange = (result) => {
      if (result && result.latitude && result.longitude) {
        this.state.lat = result.latitude;
        this.state.lon = result.longitude;
        console.log("GPS Found", this.state.lat, this.state.lon);
        this.showScreen("INPUT");
        this.geolocation.stop();
        this.geolocation = null;
      }
    };

    // Fallback/Timeout for testing if no GPS signal indoors
    setTimeout(() => {
      if (!this.state.lat) {
        hmUI.showToast({ text: "No GPS signal, using mock." });
        this.state.lat = -6.2088;
        this.state.lon = 106.8456;
        this.showScreen("INPUT");
        if (this.geolocation) {
          this.geolocation.stop();
          this.geolocation = null;
        }
      }
    }, 5000);
  },

  handleInput(key) {
    if (key === "DEL") {
      this.state.inputCode = this.state.inputCode.slice(0, -1);
    } else if (key === "OK") {
      this.validateCode();
    } else {
      if (this.state.inputCode.length < 5) {
        this.state.inputCode += key;
      }
    }
    this.state.txtInput.setProperty(hmUI.prop.TEXT, this.state.inputCode);
  },

  validateCode() {
    if (this.state.inputCode === "12345") {
      this.state.userName = "Deni";
      this.state.lblName.setProperty(hmUI.prop.TEXT, "User: " + this.state.userName);
      this.state.lblLat.setProperty(hmUI.prop.TEXT, "Latitude: " + this.state.lat.toFixed(5));
      this.state.lblLon.setProperty(hmUI.prop.TEXT, "Longitude: " + this.state.lon.toFixed(5));
      this.showScreen("DASHBOARD");
    } else {
      hmUI.showToast({ text: "Invalid Code" });
      this.state.inputCode = "";
      this.state.txtInput.setProperty(hmUI.prop.TEXT, "");
    }
  },

  performCheck(type) {
    // 1. Shift Time Validation
    const now = new Date();
    const hour = now.getHours();

    // Shift: 08:00 - 17:00
    if (hour < 8 || hour >= 17) {
      hmUI.showToast({ text: "Outside Shift Hours (08-17)" });
      return;
    }

    // 2. Anti Fake GPS (Simple Check)
    // Check if lat/lon is exactly 0 or identical to typical mock locations if known
    if (this.state.lat === 0 && this.state.lon === 0) {
      hmUI.showToast({ text: "GPS Invalid" });
      return;
    }

    // 3. Connect to Backend
    hmUI.showToast({ text: "Connecting..." });

    // Mock Fetch
    const payload = {
      user: this.state.userName,
      type: type,
      lat: this.state.lat,
      lon: this.state.lon,
      time: now.toISOString()
    };

    console.log("Sending:", JSON.stringify(payload));

    // Simulation of success
    setTimeout(() => {
      hmUI.showToast({ text: type + " Success!" });
    }, 1500);
  }
});
