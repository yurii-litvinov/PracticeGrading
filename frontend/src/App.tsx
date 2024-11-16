import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom';
import {Layout} from './components/Layout'
import {MeetingFormPage} from './pages/MeetingFormPage'
import {MeetingsPage} from './pages/MeetingsPage';
import {LoginPage} from './pages/LoginPage';
import {ProfilePage} from './pages/ProfilePage';
import {CriteriaPage} from './pages/CriteriaPage';
import {ViewMeetingPage} from './pages/ViewMeetingPage';

export function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout/>,
            children: [
                {
                    path: "/",
                    element: <Navigate to="/meetings" replace/>,
                },
                {
                    path: "/meetings",
                    element: <MeetingsPage/>,
                },
                {
                    path: "/profile",
                    element: <ProfilePage/>,
                },
                {
                    path: "/meetings/new",
                    element: <MeetingFormPage/>,
                },
                {
                    path: "/meetings/edit/:id",
                    element: <MeetingFormPage/>,
                },
                {
                    path: "/criteria",
                    element: <CriteriaPage/>,
                },
                {
                    path: "/meetings/:id",
                    element: <ViewMeetingPage/>,
                },
            ],
        },
        {
            path: "/login",
            element: <LoginPage/>,
        },
    ]);

    return <RouterProvider router={router}/>;
}
