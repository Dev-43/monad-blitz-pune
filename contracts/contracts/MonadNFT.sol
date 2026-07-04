// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MonadNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId = 1;
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MINT_PRICE = 0.05 ether; // 0.05 MON

    event NFTMinted(address indexed minter, uint256 indexed tokenId);

    constructor() ERC721("Monad Blitz NFT", "MBLITZ") Ownable(msg.sender) {}

    function mint() external payable {
        require(nextTokenId <= MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient MON sent");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);

        emit NFTMinted(msg.sender, tokenId);
    }

    function getColors(uint256 tokenId) public pure returns (string memory color1, string memory color2, string memory name) {
        uint256 palette = tokenId % 4;
        if (palette == 0) {
            return ("#8B75FF", "#FF57B6", "Giga Purple");
        } else if (palette == 1) {
            return ("#8B75FF", "#00FFFF", "Monad Cyan");
        } else if (palette == 2) {
            return ("#FFD700", "#FF4500", "Solar Flare");
        } else {
            return ("#00FFFF", "#39FF14", "Matrix Green");
        }
    }

    function generateSVG(uint256 tokenId) public pure returns (string memory) {
        (string memory c1, string memory c2, ) = getColors(tokenId);
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">',
                '<defs>',
                '<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" stop-color="', c1, '" />',
                '<stop offset="100%" stop-color="', c2, '" />',
                '</linearGradient>',
                '<filter id="glow">',
                '<feGaussianBlur stdDeviation="15" result="coloredBlur"/>',
                '<feMerge>',
                '<feMergeNode in="coloredBlur"/>',
                '<feMergeNode in="SourceGraphic"/>',
                '</feMerge>',
                '</filter>',
                '</defs>',
                '<rect width="100%" height="100%" fill="#0E091C"/>',
                '<rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="url(#grad)" stroke-width="4" filter="url(#glow)"/>',
                '<rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="url(#grad)" stroke-width="2"/>',
                '<text x="50%" y="30%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" letter-spacing="2">MONAD BLITZ</text>',
                '<circle cx="200" cy="200" r="50" fill="url(#grad)"/>',
                '<path d="M195 165 L215 195 L200 195 L205 235 L185 205 L200 205 Z" fill="#FFFFFF"/>',
                '<text x="50%" y="310" dominant-baseline="middle" text-anchor="middle" fill="#C8D0E8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">TOKEN #', tokenId.toString(), '</text>',
                '<text x="50%" y="340" dominant-baseline="middle" text-anchor="middle" fill="#8490B0" font-family="system-ui, -apple-system, sans-serif" font-size="12">MONAD TESTNET</text>',
                '</svg>'
            )
        );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        (, , string memory paletteName) = getColors(tokenId);
        string memory svg = generateSVG(tokenId);
        
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Monad Blitz NFT #', tokenId.toString(), '", ',
                        '"description": "An exclusive on-chain dynamic SVG NFT celebrating Monad Blitz Pune.", ',
                        '"attributes": [{"trait_type": "Palette", "value": "', paletteName, '"}], ',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No MON to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
