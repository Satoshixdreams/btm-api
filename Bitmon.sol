// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^4.9.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts@4.9.0/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@4.9.0/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts@4.9.0/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts@4.9.0/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts@4.9.0/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts@4.9.0/access/Ownable.sol";

contract Bitmon is ERC20, ERC20Burnable, ERC20Pausable, ERC20Snapshot, Ownable, ERC20Permit {
    uint256 private immutable MAX_SUPPLY; // الحد الأقصى للعرض
    uint256 public constant FEE_PERCENTAGE = 1; // رسوم التحويل (1%)
    mapping(address => bool) public blacklist; // قائمة سوداء للعناوين

    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);
    event SnapshotTaken(uint256 id);

    constructor(address initialOwner, address recipient)
        ERC20("Bitmon", "BTM")
        Ownable()
        ERC20Permit("Bitmon")
    {
        MAX_SUPPLY = 1_000_000_000 * 10 ** decimals(); // الحد الأقصى للعرض: مليار رمز
        _mint(initialOwner, 105_000_000 * 10 ** decimals()); // إصدار 105 مليون للمالك
        _mint(recipient, 105_000_000 * 10 ** decimals()); // إصدار 105 مليون للمستلم
        transferOwnership(initialOwner); // تعيين المالك يدويًا
    }

    // وظيفة لإيقاف العقد (فقط المالك يمكنه تنفيذها)
    function pause() public onlyOwner {
        _pause();
    }

    // وظيفة لاستئناف العقد (فقط المالك يمكنه تنفيذها)
    function unpause() public onlyOwner {
        _unpause();
    }

    // وظيفة لإصدار رموز جديدة (مع التحقق من الحد الأقصى للعرض)
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(to, amount);
    }

    // وظيفة لحرق الرموز من حساب معين (فقط المالك يمكنه تنفيذها)
    function burnFrom(address account, uint256 amount) public onlyOwner override {
        require(account != address(0), "Invalid address");
        require(balanceOf(account) >= amount, "Insufficient balance");

        _burn(account, amount);
    }

    // وظيفة لإضافة عنوان إلى القائمة السوداء (فقط المالك يمكنه تنفيذها)
    function addToBlacklist(address account) public onlyOwner {
        require(account != address(0), "Invalid address");
        require(!blacklist[account], "Account already blacklisted");

        blacklist[account] = true;
        emit Blacklisted(account);
    }

    // وظيفة لإزالة عنوان من القائمة السوداء (فقط المالك يمكنه تنفيذها)
    function removeFromBlacklist(address account) public onlyOwner {
        require(account != address(0), "Invalid address");
        require(blacklist[account], "Account not blacklisted");

        blacklist[account] = false;
        emit Unblacklisted(account);
    }

    // وظيفة لأخذ لقطة (Snapshot) للأرصدة
    function snapshot() public onlyOwner returns (uint256) {
        uint256 snapshotId = _snapshot();
        emit SnapshotTaken(snapshotId);
        return snapshotId;
    }

    // تعديل عملية التحويل لفرض رسوم وتطبيق القائمة السوداء
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Pausable, ERC20Snapshot)
    {
        require(!blacklist[from], "Sender is blacklisted");
        require(!blacklist[to], "Recipient is blacklisted");

        super._beforeTokenTransfer(from, to, amount);

        if (from != address(0) && to != address(0)) { // لا تفرض رسوم عند الإصدار أو الحرق
            uint256 fee = (amount * FEE_PERCENTAGE) / 100; // حساب الرسوم (1%)
            uint256 amountAfterFee = amount - fee;

            if (fee > 0) {
                _transfer(from, owner(), fee); // إرسال الرسوم إلى المالك
                _transfer(from, to, amountAfterFee); // تحويل المبلغ بعد خصم الرسوم
            }
        }
    }

    // إضافة وظيفة للحصول على رصيد في لقطة معينة (Snapshot)
    function balanceOfAt(address account, uint256 snapshotId) public view override returns (uint256) {
        return super.balanceOfAt(account, snapshotId);
    }

    // إضافة وظيفة للحصول على إجمالي العرض في لقطة معينة
    function totalSupplyAt(uint256 snapshotId) public view override returns (uint256) {
        return super.totalSupplyAt(snapshotId);
    }

    // وظيفة لعرض الحد الأقصى للعرض
    function maxSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }
}