import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BaseRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/base/processos', { replace: true });
  }, [navigate]);

  return null;
}