import { Transaction, Networks, StrKey } from "@stellar/stellar-sdk";

const xdr = "AAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ854AAAAAAAAAAQAAAAEAAAAAAAAAAAAAAABp82YPAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABhIobnBRqCbIbRvC3StEzHuI+DaWTLFrIXvfwO+TWuAkAAAAEbWludAAAAAMAAAASAAAAAAAAAAAVvrsQUQ7yTiI+k29x2MJP6zJBHWJtSLnl0rhxx3M50wAAAA0AAABBBKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoAAAAAAAANAAAAQQSdAYKZnCZaCMfd2neTS4iRiPnLbbGwF+QbrGWGM+eQgpIGMdDTuUFbPbGB1GIlq6LO18aj/hyJebNsqKOAIlqCAAAAAAAAAQAAAAEAAAAAAAAAABW+uxBRDvJOIj6Tb3HYwk/rMkEdYm1IueXSuHHHcznTBPGOL22+iM4AAAAAAAAAAQAAAAAAAAABhIobnBRqCbIbRvC3StEzHuI+DaWTLFrIXvfwO+TWuAkAAAAEbWludAAAAAMAAAASAAAAAAAAAAAVvrsQUQ7yTiI+k29x2MJP6zJBHWJtSLnl0rhxx3M50wAAAA0AAABBBKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoAAAAAAAANAAAAQQSdAYKZnCZaCMfd2neTS4iRiPnLbbGwF+QbrGWGM+eQgpIGMdDTuUFbPbGB1GIlq6LO18aj/hyJebNsqKOAIlqCAAAAAAAAAAAAAAEAAAAAAAAAAgAAAAAAAAAAFb67EFEO8k4iPpNvcdjCT+syQR1ibUi55dK4ccdzOdMAAAAHbHxAXprp2JGYX1i0/5bnf373Tbpk28+C2U7EqyCgG+AAAAAEAAAABgAAAAAAAAAAFb67EFEO8k4iPpNvcdjCT+syQR1ibUi55dK4ccdzOdMAAAAVBPGOL22+iM4AAAAAAAAABgAAAAGEihucFGoJshtG8LdK0TMe4j4NpZMsWshe9/A75Na4CQAAABAAAAABAAAAAgAAAA8AAAAIU291bEJ5SWQAAAADAAAAAQAAAAEAAAAGAAAAAYSKG5wUagmyG0bwt0rRMx7iPg2lkyxayF738Dvk1rgJAAAAEAAAAAEAAAACAAAADwAAAA1Tb3VsQnlQYXNza2V5AAAAAAAADQAAAEEEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgAAAAAAAAEAAAAGAAAAAYSKG5wUagmyG0bwt0rRMx7iPg2lkyxayF738Dvk1rgJAAAAFAAAAAEAFnDPAAAAkAAAA3wAAAAAABnzOgAAAAHHcznTAAAAQM6Gf0NKkHjewk3pZszbl3b0qycDpsWcIbntY5mhYXmjkbW+aZ+lGcl2rK5pzIn2zjxMaABRhNAxS5qMpc/OnAU=";

try {
    const tx = new Transaction(xdr, Networks.TESTNET);
    console.log("Source Account:", tx.source);
    
    tx.operations.forEach((op, index) => {
        if (op.type === "invokeHostFunction") {
            const func = op.func;
            if (func.switch().name === "hostFunctionTypeInvokeContract") {
                const invoke = func.invokeContract();
                const contractId = invoke.contractAddress().contractId().toString("hex");
                console.log(`Op ${index} calls contract (hex):`, contractId);
                // Convert hex to StrKey
                const strkey = StrKey.encodeContract(invoke.contractAddress().contractId());
                console.log(`Op ${index} calls contract (StrKey):`, strkey);
            }
        }
    });
} catch (e) {
    console.error("Failed to decode XDR:", e);
}
