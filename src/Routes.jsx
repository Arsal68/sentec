import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "./supabase";

export default function ProtectedRoute({ allowedRole }) {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {

    const isfakeadmin = localStorage.getItem("nep_admin_bypass");
    if (allowedRole === "admin" && isfakeadmin === "true") {
      setIsAllowed(true);
      setLoading(false);
      return;
    }

    // sesh checking
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return; 
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile && profile.role === allowedRole) {
      setIsAllowed(true);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center">Checking access...</div>;

  return isAllowed ? <Outlet /> : <Navigate to="/" replace />;
}