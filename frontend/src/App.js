import React, { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const checkWalletIsConnected = async () => {
    const { solana } = window;
    if (solana?.isPhantom) {
      console.log("Phatom is found");
      const response = await solana.connect({
        onlyIfTrusted: true,
      });
      console.log("connect public key::", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    } else {
      console.log("No wallet is found");
    }
  };

  const connectToWallet = async () => {
    const { solana } = window;
    const response = await solana.connect({
      onlyIfTrusted: true,
    });
    setWalletAddress(response.publicKey.toString());
    console.log("connect public key::", response.publicKey.toString());
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  const button = () => {
    <div>
      <button onClick={() => connectToWallet()}>Connect Phantom</button>
    </div>;
  };

  return <>{!walletAddress && button}</>;
};

export default App;
