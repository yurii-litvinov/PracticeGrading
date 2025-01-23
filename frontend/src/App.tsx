import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom';
import {Layout} from './components/Layout'
import {MeetingFormPage} from './pages/MeetingFormPage'
import {MeetingsPage} from './pages/MeetingsPage';
import {LoginPage} from './pages/LoginPage';
import {ProfilePage} from './pages/ProfilePage';
import {CriteriaPage} from './pages/CriteriaPage';
import {ViewMeetingPage} from './pages/ViewMeetingPage';
import {MemberLoginPage} from './pages/MemberLoginPage';
import {MemberPage} from './pages/MemberPage';
import {StudentWorkPage} from './pages/StudentWorkPage';

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
                {
                    path: "/meetings/:id/member",
                    element: <MemberPage/>,
                },
                {
                    path: "/meetings/:meetingId/studentwork/:workId",
                    element: <StudentWorkPage/>,
                },
            ],
        },
        {
            path: "/login",
            element: <LoginPage/>,
        },
        {
            path: "/meetings/:id/member/login",
            element: <MemberLoginPage/>,
        },
    ]);

    return <RouterProvider router={router}/>;
}
