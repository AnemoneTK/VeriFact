export function getUser() {
  if (typeof window !== "undefined") {
    const userString = localStorage.getItem("user");
    return userString ? JSON.parse(userString) : null;
  }
  return null;
}

export function setUser(userData) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(userData));
  }
}

export function removeUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
}

export function useAuth() {
  const [user, setUser] = useState(getUser());

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

// Higher-order component for route protection
export function withAuth(Component) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
      if (!user) {
        router.push("/auth/login");
      }
    }, [user, router]);

    if (!user) {
      return null; // or a loading spinner
    }

    return <Component {...props} />;
  };
}
