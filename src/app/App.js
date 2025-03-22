import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import PaymentSuccess from './components/PaymentSuccess';
import TestPage from './pages/TestPage';

console.log("App.js Loaded!"); // Debugging

const router = createBrowserRouter([
    { path: "/payment/success", element: <PaymentSuccess /> },
    { path: "/test", element: <TestPage /> }
]);

function App() {
    console.log("RouterProvider Rendered!"); // Debugging
    return <RouterProvider router={router} />;
}

export default App;
