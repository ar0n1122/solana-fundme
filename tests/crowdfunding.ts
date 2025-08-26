import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaJSONRPCError, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { Crowdfunding } from "../target/types/crowdfunding";
import { BN } from "bn.js";

describe("crowdfunding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;
  const campaignAccount = anchor.web3.Keypair.generate();

  it("Creates FundMe dapp!", async () => {
    await program.methods
      .initialize("FundMeApp", "This is fundMe")
      .accounts({
        campaign: campaignAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([campaignAccount])
      .rpc();
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

  it("donate Funds", async () => {
    const initialBalance = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    await program.methods
      .donate(new anchor.BN(1))
      .accounts({
        campaign: campaignAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .rpc();

    const account = await program.account.campaign.fetch(
      campaignAccount.publicKey
    );

    assert.equal(account.amountDonated.toNumber(), 1);

    const finalBalance = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    //console.log("Balance before:", initialBalance, "after:", finalBalance);
  });

  it("withdraw Funds", async () => {
    // first donated 5 sol
    await program.methods
      .donate(new anchor.BN(5_000_000_000)) // 5 SOL
      .accounts({
        campaign: campaignAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const fundMeBalanceBefore = await provider.connection.getBalance(
      campaignAccount.publicKey
    );

    const userBefore = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    await program.methods
      .withdraw(new anchor.BN(1_000_000_000))
      .accounts({
        campaign: campaignAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      //.signers([campaignAccount]) //no signer needed, by default povider.wallet will sign
      .rpc();

    const account = await program.account.campaign.fetch(
      campaignAccount.publicKey
    );
    const fundMeBalanceAfter = await provider.connection.getBalance(
      campaignAccount.publicKey
    );

    const userAfter = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    console.log("before", fundMeBalanceBefore);
    console.log("after", fundMeBalanceAfter);
    console.log("before", userBefore);
    console.log("before", userAfter);
    assert(fundMeBalanceBefore - fundMeBalanceAfter == 1_000_000_000);
    assert(userBefore < userAfter);
  });
});
