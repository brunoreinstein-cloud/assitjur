import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ProcessosCnjLayout() {
  return <Outlet />;
}

export async function loader() {
  return null;
}
