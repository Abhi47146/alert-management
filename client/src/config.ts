// Dynamically checks if you are running Vite development mode or fallback to production
// const API_BASE = import.meta.env.DEV 
//   ? "" 
//   : "http://127.0.0.1:8000"; // Your actual PostgreSQL Flask API port

//const API_BASE = "";

// Now all your fetches look clean and adapt automatically:
//const response = await fetch(`${API_BASE}/api/users`);
const response = await fetch("/api/users");

// /home/abhishek/Downloads/drishyam-design-code/client/src/config.ts

export interface LocalCamera {
  id: string;
  name: string;
  streamUrl: string;
  ipAddress: string;
  siteName: string;
}

export const LOCAL_CAMERAS: LocalCamera[] = [

  {
    id: "camera12",
    name: "Camera12",
    streamUrl: "http://localhost:8889/camera12/",
    ipAddress: "localhost:8889",
    siteName: "solar based sites",
  },
  {
            id: "camera1",
            name: "Camera1",
            streamUrl: "http://localhost:8889/camera1/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera2",
            name: "Camera2",
            streamUrl: "http://localhost:8889/camera2/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera3",
            name: "Camera3",
            streamUrl: "http://localhost:8889/camera3/",
            ipAddress: "localhost:8889",
            siteName: "solar based sites",
        },
  {
            id: "camera4",
            name: "Camera4",
            streamUrl: "http://localhost:8889/camera4/",
            ipAddress: "localhost:8889",
            siteName: "solar based sites",
        },
  {
            id: "camera5",
            name: "Camera5",
            streamUrl: "http://localhost:8889/camera5/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera6",
            name: "Camera6",
            streamUrl: "http://localhost:8889/camera6/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera7",
            name: "Camera7",
            streamUrl: "http://localhost:8889/camera7/",
            ipAddress: "localhost:8889",
            siteName: "solar based sites",
        },
  {
            id: "camera8",
            name: "Camera8",
            streamUrl: "http://localhost:8889/camera8/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera9",
            name: "Camera9",
            streamUrl: "http://localhost:8889/camera9/",
            ipAddress: "localhost:8889",
            siteName: "solar based sites",
        },
  {
            id: "camera10",
            name: "Camera10",
            streamUrl: "http://localhost:8889/camera10/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera20",
            name: "Camera20",
            streamUrl: "http://localhost:8889/camera20/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
  {
            id: "camera11",
            name: "Camera11",
            streamUrl: "http://localhost:8889/camera11/",
            ipAddress: "localhost:8889",
            siteName: "Hyderabad Railway Station",
        },
];