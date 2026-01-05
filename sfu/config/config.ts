type WorkerLogLevel = "debug" | "warn" | "error" | "none";

type WorkerLogTag =
  | "info"
  | "ice"
  | "dtls"
  | "rtp"
  | "srtp"
  | "rtcp"
  | "rtx"
  | "bwe"
  | "score"
  | "simulcast"
  | "svc"
  | "sctp"
  | "message";

export const config = {
  port: 3031,
  sfuSecret: process.env.SFU_SECRET || "development-secret",
  //generate something using openssl before deploying to production
  //openssl rand -base64 32
  workerSettings: {
    //rtcMinPort and max are just arbitray ports for our traffic
    //useful for firewall or networking rules
    rtcMinPort: 40000,
    rtcMaxPort: 41000,
    //log levels you want to set
    logLevel: "warn" as WorkerLogLevel,
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"] as WorkerLogTag[],
  },
  videoQuality: {
    // Participants count to trigger Low Quality
    lowThreshold: Number(process.env.VIDEO_QUALITY_LOW_THRESHOLD) || 10,
    // Participants count to return to Standard Quality (Hysteresis)
    standardThreshold:
      Number(process.env.VIDEO_QUALITY_STANDARD_THRESHOLD) || 8,
  },
  // Grace period before dissolving room after last admin leaves (in ms)
  adminCleanupTimeout: Number(process.env.ADMIN_CLEANUP_TIMEOUT) || 120000,
  // Allow non-admins to create rooms (for testing)
  allowNonAdminRoomCreation: false,

  routerMediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/H264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1,
      },
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {},
    },
  ],
  webRtcTransport: {
    listenIps: [
      {
        // ip: "0.0.0.0",
        ip: "0.0.0.0",
        announcedIp: "172.16.22.196", //replace with your public IP
      },
    ],
    //for deployment
    //this is not the actual deployment link dumbo
    // webRtcTransport: {
    //   listenIps: [
    //     {
    //       ip: "0.0.0.0", //anywhere
    //       //announcedIp: 'sixseven.centralindia.cloudapp.azure.com',
    //       //// replace by public IP address
    //       announcedIp: "20.193.250.676",
    //     },
    //   ],
    // Lower bitrate to prioritize low latency and audio stability
    // 1.5 Mbps is sufficient for decent video but prevents network congestion
    maxIncomingBitrate: 1500000, //need to think about these
    initialAvailableOutgoingBitrate: 1000000,
  },
};

export default config;
