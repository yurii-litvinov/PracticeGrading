import React, {useEffect, useState} from 'react';
import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom';
import {MeetingsPage} from './pages/MeetingsPage';
import {LoginPage} from './pages/LoginPage';
import {ProfilePage} from './pages/ProfilePage';
import {Layout} from './components/Layout'
import {CreateMeetingPage} from './pages/CreateMeetingPage'

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
                    element: <CreateMeetingPage/>,
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
