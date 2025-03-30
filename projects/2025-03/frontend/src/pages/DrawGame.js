import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import CardDisplay from '../components/CardDisplay';
import DrawHistory from '../components/DrawHistory';
import '../index.css';

// 用于展示钱包地址的工具函数
const shortenAddress = (address) => {
  return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
};

// 根据稀有度获取样式类
const getRarityClass = (rarity) => {
  switch(rarity.toLowerCase()) {
    case 'legendary': return 'rarity-legendary';
    case 'epic': return 'rarity-epic';
    case 'rare': return 'rarity-rare';
    case 'uncommon': return 'rarity-uncommon';
    default: return 'rarity-common';
  }
};

// 导入示例卡牌背景图
const cardBackImage = require('../images/1.png');

const DrawGame = () => {
  const { account, gameContract, balance, setBalance } = useWeb3();
  const [drawPrice, setDrawPrice] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawnCard, setLastDrawnCard] = useState(null);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [userHistory, setUserHistory] = useState({
    lastCards: [],
    totalDraws: 0,
    totalRewards: 0
  });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // 使用假数据更新游戏数据
  const updateGameData = async () => {
    try {
      // 设置假的抽卡价格
      setDrawPrice("0.015"); // 0.015 ETH
      
      // 设置假的奖池金额
      setJackpot("0.75"); // 0.75 ETH
      
      // 初始化用户历史数据（如果还没有）
      if (!userHistory.totalDraws) {
        setUserHistory({
          totalDraws: 0,
          totalRewards: "0.0",
          lastCards: [] // 初始时没有卡片
        });
      }
      
      // 更新余额
      if (account) {
        // 如果有钱包连接，使用真实余额
        updateBalance();
      } else {
        // 如果没有钱包，使用假余额
        setBalance("1.0");
      }
    } catch (error) {
      console.error("获取游戏数据失败:", error);
    }
  };
  
  // 组件加载时执行
  useEffect(() => {
    // 初始化游戏数据
    updateGameData();
  }, []);
  
  // 更新ETH余额
  const updateBalance = useCallback(async () => {
    if (account) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(newBalance));
    }
  }, [account, setBalance]);
  
  // 连接钱包函数
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("请安装MetaMask!");
      return;
    }
    
    try {
      // 请求用户授权
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        window.location.reload(); // 刷新页面以确保正确加载合约
      }
    } catch (error) {
      console.error("连接钱包失败:", error);
      alert("连接钱包失败，请重试");
    }
  };

  // 不再需要获取测试代币的函数，因为我们使用ETH

  // 使用ETH代替TRI代币，不再需要铸造代币的功能

  // 使用假数据抽卡，不需要区块链交互
  const handleDraw = async () => {
    if (!account) {
      alert("请先连接钱包");
      return;
    }
    
    try {
      console.log("开始抽卡流程...");
      setIsDrawing(true);
      setIsCardAnimating(true);
      
      // 模拟抽卡延迟
      console.log("模拟抽卡过程...");
      
      // 生成随机卡片数据
      const randomCards = [];
      for (let i = 0; i < 3; i++) {
        // 随机生成一个1-50的ID，对应images文件夹中的图片
        const randomId = Math.floor(Math.random() * 50) + 1;
        const randomRarity = ["Common", "Uncommon", "Rare", "Epic", "Legendary"][Math.floor(Math.random() * 5)];
        const randomPoints = Math.floor(Math.random() * 100) + 1;
        
        randomCards.push({
          id: randomId,
          name: `卡片 #${randomId}`,
          description: `这是一张${randomRarity}稀有度的卡片`,
          rarity: randomRarity,
          points: randomPoints,
          imageId: randomId // 存储图片ID而不是完整URL
        });
      }
      
      // 模拟奖励逻辑
      let reward = 0;
      const cardTypes = randomCards.map(card => card.rarity);
      // 检查是否有三张相同稀有度的卡片
      const rarityCounts = cardTypes.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      
      const hasTriplet = Object.values(rarityCounts).some(count => count >= 3);
      const matchedRarity = hasTriplet ? Object.keys(rarityCounts).find(rarity => rarityCounts[rarity] >= 3) : null;
      
      if (hasTriplet) {
        // 根据稀有度决定奖励金额
        const rarityMultipliers = {
          "Common": 0.05,
          "Uncommon": 0.08,
          "Rare": 0.12,
          "Epic": 0.2,
          "Legendary": 0.3
        };
        
        const baseReward = rarityMultipliers[matchedRarity] || 0.05;
        reward = (baseReward + Math.random() * 0.05).toFixed(4); // 带有小浮动的奖励
        
        // 显示特殊效果
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // 5秒后关闭
        
        alert(`恭喜您抽到了三张${matchedRarity}稀有度的卡片！\n\n获得 ${reward} ETH 奖励！`);
      }
      
      // 更新卡片历史
      setUserHistory(prev => ({
        ...prev,
        totalDraws: prev.totalDraws + 1,
        totalRewards: (parseFloat(prev.totalRewards) + parseFloat(reward)).toFixed(4),
        lastCards: randomCards
      }));
      
      // 设置最新抽到的卡片
      setLastDrawnCard(randomCards[0]);
      
      // 卡片动画完成后重置状态 - 缩短动画时间
      setTimeout(() => {
        setIsCardAnimating(false);
        setIsDrawing(false); // 确保抽卡状态也被重置，允许再次抽卡
        console.log("动画完成，抽卡按钮已解锁");
      }, 800); // 从1500ms缩短到800ms
    } catch (error) {
      console.error("抽卡失败:", error);
      alert("抽卡过程中出现错误，请重试");
      // 立即重置所有状态，允许再次抽卡
      setIsDrawing(false);
      setIsCardAnimating(false);
    }
    
    // 模拟更新游戏数据
    // 随机设置抽卡价格和奖池
    setDrawPrice((Math.random() * 0.01 + 0.01).toFixed(4));
    setJackpot((Math.random() * 1 + 0.5).toFixed(4));
    console.log("抽卡完成，可再次抽卡");
    
    // 更新余额 - 模拟花费ETH
    if (account) {
      updateBalance();
    }
  };
  
  return (
    <div className="draw-game">
      <div className="game-info">
        <h1>Trisolaris抽卡游戏</h1>
        {account ? (
          <div className="wallet-info">
            <p>已连接钱包: {shortenAddress(account)}</p>
          </div>
        ) : (
          <div className="wallet-alert">
            <button className="btn btn-primary mb-3" onClick={connectWallet}>连接钱包</button>
            <p className="text-warning">请先连接钱包以开始游戏</p>
          </div>
        )}
        <div className="stats">
          <p>抽卡价格: {drawPrice} ETH</p>
          <p>奖池金额: {jackpot} ETH</p>
          <p>您的ETH余额: {balance} ETH</p>
        </div>
      </div>
      
      <div className="card-section">
        <div className="current-cards">
          <h2>您的最近三张卡牌</h2>
          <div className="card-row">
            {userHistory.lastCards.map((card, index) => (
              <div key={index} className="card-container">
                <div className="card">
                  <h4>{card.name}</h4>
                  <p className={`rarity-${card.rarity.toLowerCase()}`}>{card.rarity}</p>
                  <img 
                    src={require(`../images/${card.imageId}.png`)} 
                    alt={card.name} 
                    className="card-image" 
                  />
                  <p>{card.description}</p>
                  <p>点数: {card.points}</p>
                </div>
              </div>
            ))}
            {Array(3 - userHistory.lastCards.length).fill().map((_, index) => (
              <div key={`empty-${index}`} className="empty-card">?</div>
            ))}
          </div>
        </div>
        
        <div className="last-drawn">
          <h3>抽卡区域</h3>
          {isCardAnimating ? (
            <div className="card-container draw-animation">
              <div className="card-inner">
                <div className="card-front">
                  <img src={cardBackImage} alt="Card Back" className="card-image" />
                </div>
                <div className="card-back">
                  <h4>正在抽取三张卡牌...</h4>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-container">
              <div className="card-inner">
                <div className="card-front">
                  <img src={cardBackImage} alt="Card Back" className="card-image" />
                </div>
                <div className="card-back">
                  <h4>点击下方按钮抽卡</h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="actions">
        <button 
          className="draw-button" 
          onClick={handleDraw} 
          disabled={isDrawing}
          style={{ 
            opacity: isDrawing ? 0.7 : 1,
            cursor: isDrawing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease' 
          }}
        >
          {isDrawing ? "抽卡中..." : userHistory.totalDraws > 0 ? "再次抽卡" : "开始抽卡"}
        </button>
      </div>
      
      <DrawHistory 
        totalDraws={userHistory.totalDraws} 
        totalRewards={userHistory.totalRewards + " ETH"} 
      />
    </div>
  );
};

export default DrawGame;