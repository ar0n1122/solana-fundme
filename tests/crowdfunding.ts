import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { Crowdfunding } from "../target/types/crowdfunding";

describe("crowdfunding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;
  const campaignAccount = anchor.web3.Keypair.generate();

  it("Creates FundMe dapp!", async () => {
    await program.rpc.initialize("FundMeApp", "This is fundMe", {
      accounts: {
        campaign: campaignAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [campaignAccount],
    });
    const account = await program.account.campaign.fetch(
      campaignAccount.publicKey
    );
    assert.equal(account.name, "FundMeApp");
    assert.equal(account.description, "This is fundMe");
    assert.equal(account.amountDonated.toNumber(), 0);
    assert.equal(
      account.admin.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
  });
});
