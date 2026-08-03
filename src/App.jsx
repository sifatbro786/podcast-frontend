import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/client/Homepage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Homepage />} />
        </Routes>
    );
}
