import { BrowserRouter } from "react-router-dom";
import FellowRoutes from "./routes/FellowRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <FellowRoutes />
    </BrowserRouter>
  );
}
