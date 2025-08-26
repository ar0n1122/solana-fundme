use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("F4p2h6VUwQpfN7couCcg2NwStAGDBHS9AnfnAgmzaxRb");

#[program]
pub mod crowdfunding {

    use super::*;

    pub fn initialize(ctx: Context<Create>, name: String, description: String) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        campaign.amount_donated = 0;
        campaign.admin = ctx.accounts.user.key();
        Ok(())
    }

    // withdraw funds
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let user = &mut ctx.accounts.user;
        if campaign.admin != user.key() {
            return Err(Error::from(ErrorCode::Unauthorized));
        }
        let rent_balance = Rent::get()?.minimum_balance(campaign.to_account_info().data_len());
        if **campaign.to_account_info().lamports.borrow() - rent_balance < amount {
            return Err(Error::from(ErrorCode::InsufficientFunds));
        }
        **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.campaign.to_account_info(),
            },
        );

        // Perform the transfer
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update campaign state
        let campaign = &mut ctx.accounts.campaign;
        campaign.amount_donated = campaign
            .amount_donated
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    //PDA account
    #[account(init, payer=user, space=9000)]
    pub campaign: Account<'info, Campaign>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>, //for init, creation
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    #[account(mut)]
    pub user: Signer<'info>, // donor

    pub system_program: Program<'info, System>, //for transfer
}

#[account]
pub struct Campaign {
    pub admin: Pubkey,
    pub name: String,
    pub description: String,
    pub amount_donated: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to withdraw funds from this campaign")]
    Unauthorized,

    #[msg("Insufficient funds in campaign account")]
    InsufficientFunds,

    #[msg("Amount overflow detected")]
    Overflow, // ✅ add this
}
