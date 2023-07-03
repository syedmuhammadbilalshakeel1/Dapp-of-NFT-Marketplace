const { expect } = require("chai");
const { ethers } = require("ethers");

describe("NFTMarketplace", function () {
  let nftMarketplace;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    // Get signers from the ethers provider
    [owner, user1, user2] = await ethers.getSigners();

    // Compile and deploy the contract
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    nftMarketplace = await NFTMarketplace.deploy();
    await nftMarketplace.deployed();
  });

  it("should create a token and list it for sale", async function () {
    // Create a new NFT token
    await nftMarketplace.createToken(
      "https://example.com/nft1",
      ethers.utils.parseEther("1")
    );

    // Get the market items
    const marketItems = await nftMarketplace.fetchMarketItem();

    // Verify that the token was created and listed for sale
    expect(marketItems.length).to.equal(1);
    expect(marketItems[0].tokenId).to.equal(1);
    expect(marketItems[0].seller).to.equal(owner.address);
    expect(marketItems[0].owner).to.equal(nftMarketplace.address);
    expect(marketItems[0].price).to.equal(ethers.utils.parseEther("1"));
    expect(marketItems[0].sold).to.equal(false);
  });

  it("should allow a user to purchase a token", async function () {
    // Create a new NFT token
    await nftMarketplace.createToken(
      "https://example.com/nft1",
      ethers.utils.parseEther("1")
    );

    // User 1 purchases the token
    await nftMarketplace
      .connect(user1)
      .createMarketSale(1, { value: ethers.utils.parseEther("1") });

    // Get user 1's NFTs
    const user1NFTs = await nftMarketplace.connect(user1).fetchMyNFT();

    // Verify that user 1 owns the purchased token
    expect(user1NFTs.length).to.equal(1);
    expect(user1NFTs[0].tokenId).to.equal(1);
    expect(user1NFTs[0].owner).to.equal(user1.address);
  });

  it("should allow the owner to update the listing price", async function () {
    // Update the listing price
    const newListingPrice = ethers.utils.parseEther("0.002");
    await nftMarketplace.connect(owner).updateListingPrice(newListingPrice);

    // Get the updated listing price
    const listingPrice = await nftMarketplace.getListingPrice();

    // Verify that the listing price was updated
    expect(listingPrice).to.equal(newListingPrice);
  });

  it("should allow the owner to fetch unsold NFTs", async function () {
    // Create and list two NFT tokens
    await nftMarketplace.createToken(
      "https://example.com/nft1",
      ethers.utils.parseEther("1")
    );
    await nftMarketplace.createToken(
      "https://example.com/nft2",
      ethers.utils.parseEther("2")
    );

    // Fetch the unsold NFTs
    const unsoldNFTs = await nftMarketplace.fetchMarketItem();

    // Verify that there are two unsold NFTs
    expect(unsoldNFTs.length).to.equal(2);
    expect(unsoldNFTs[0].sold).to.equal(false);
    expect(unsoldNFTs[1].sold).to.equal(false);
  });

  it("should allow a user to re-sell their token", async function () {
    // Create and list an NFT token
    await nftMarketplace.createToken(
      "https://example.com/nft1",
      ethers.utils.parseEther("1")
    );

    // User 1 re-sells the token
    await nftMarketplace
      .connect(user1)
      .reSellToken(1, ethers.utils.parseEther("2"));

    // Fetch user 1's listed items
    const listedItems = await nftMarketplace.connect(user1).fetchItemsListed();

    // Verify that the token was re-listed with the new price
    expect(listedItems.length).to.equal(1);
    expect(listedItems[0].tokenId).to.equal(1);
    expect(listedItems[0].seller).to.equal(user1.address);
    expect(listedItems[0].owner).to.equal(nftMarketplace.address);
    expect(listedItems[0].price).to.equal(ethers.utils.parseEther("2"));
    expect(listedItems[0].sold).to.equal(false);
  });
});
