import React, { useEffect, useState } from "react";
import "./App.css";
import idl from "./idl.json";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor";
//import Buffer from "buffer";

const programId = new PublicKey(idl.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};
const { SystemProgram } = web3;

const App = () => {
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

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

  const createCampaign = async () => {
    const provider = getProvider();
    const program = new Program(idl, programId, provider);

    console.log(program.account);
    const [campaign] = await PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Generate a new campaign account
    const campaignKeypair = web3.Keypair.generate();

    //call to create
    await program.methods
      .initialize("FundME", "Description of FundMe")
      .accounts({
        campaign,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([campaignKeypair]) // campaign must sign since it's being created
      .rpc();

    console.log("crated campaign::", campaign);
  };

  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const onLoad = async () => {
      await checkWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  const connectButton = () => {
    return (
      <div>
        <button onClick={() => connectToWallet()}>Connect Phantom</button>
      </div>
    );
  };

  const createCampaignButton = () => {
    return (
      <div>
        <button onClick={() => createCampaign()}>create Campaign</button>
      </div>
    );
  };

  return (
    <div className="App">
      <h1>Hello!</h1>
      {!walletAddress ? connectButton() : createCampaignButton()}
    </div>
  );
};

export default App;
