import { Button, notification } from "antd";
import { useState } from "react";

const TokenApproval = ({ symbol, address, tx, writeContracts, readContracts, amount }) => {
  const [approveBtnDisabled, setApproveBtnDisabled] = useState(false);

  return (
    <Button
      type="primary"
      style={{ marginLeft: 20 }}
      disabled={approveBtnDisabled}
      onClick={async () => {
        setApproveBtnDisabled(true);
        if (!address) {
          const tokens = await readContracts.GameContract.getCurrencies();
          const token = tokens.find(t => t.symbol === symbol);
          if (!token) return;
          address = token.addressToken;
        }
        // const decimals = await readContracts.GameToken.attach(address).decimals();
        const decimals = 0;
        const result = await tx(
          writeContracts.GameToken.attach(address).approve(
            writeContracts.GameContract.address,
            amount * 10 ** decimals + "",
          ),
        );
        console.log("APPROVE RESULT", result);
        setApproveBtnDisabled(false);
        notification.success({
          message: "Success",
          description: `Approved ${amount} ${symbol}`,
        });
        setApproveBtnDisabled(false);
      }}
    >
      Approve token
    </Button>
  )
}

export default TokenApproval;
