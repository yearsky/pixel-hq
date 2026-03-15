import { useState } from "react";
import GlobalStyles from "./GlobalStyles";
import BootScreen from "./BootScreen";
import LandingPage from "./LandingPage";
import OfficeWorld from "./OfficeWorld";

export default function PixelForceHQ() {
  // page: 'landing' | 'booting' | 'world'
  const [page, setPage] = useState("landing");

  // Chat history lives here so it persists across page transitions.
  // Both the world view and any future views can read/write it.
  const [chats, setChats] = useState({});

  const handleEnter = () => setPage("booting");

  if (page === "landing") return (
    <>
      <GlobalStyles />
      <LandingPage onEnter={handleEnter} />
    </>
  );

  if (page === "booting") return (
    <>
      <GlobalStyles />
      <BootScreen onComplete={() => setPage("world")} />
    </>
  );

  // World view — the main pixel office world
  return (
    <>
      <GlobalStyles />
      <OfficeWorld
        onBack={() => setPage("landing")}
        chats={chats}
        setChats={setChats}
      />
    </>
  );
}