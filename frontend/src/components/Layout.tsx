import React from 'react';
import {Outlet} from 'react-router-dom';
import {NavBar} from './NavBar';

export function Layout() {
    return (
        <>
            <NavBar/>
            <div className="container mt-4">
                <Outlet/>
            </div>
        </>
    );
}
