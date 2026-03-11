class SubscriptionButton extends HTMLElement{
    constructor(){
        super();

        this.variantId = this.dataset.variantId;
        this.checkout = this.dataset.checkout;
        this.razorpayPublicKey = 'rzp_live_S6VRUo8tBXPJep'
        console.log()

        this.addEventListener("click",this.handleButtonClick.bind(this));
    };

    async handleButtonClick(){
        this.classList.add('loading');
        try{
           const subscription = await this.initiateSubscription.call(this);
           console.log(subscription.amount);
           const checkout = await this.initRazorpayCheckout.call(this,subscription.id,subscription.amount,"https://xclusive.money/pages/thank-you");
        }catch(err){
            console.log("failed to handle button click reason -->" + err.message);
            window.location.href = this.checkout;
        }finally{
            this.classList.remove('loading');
        }
    };
    async initiateSubscription(){
        try{
            const payload = {
                variantId : this.variantId
            }
            const url = `/apps/xclusive-payment/customCheckout`;
            const request = await fetch(url,{
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(payload)
            });
            const res = await request.json();
            return JSON.parse(res);
        }catch(err){
            throw new Error("Failed to intiate subscription reason -->" + err.message);
        }
    };
    async initRazorpayCheckout(subscriptionId,amount,redirectionUrl = ''){
        try{
            const options = {
                key: this.razorpayPublicKey,
                subscription_id: subscriptionId,
                name: 'Xclusive money',
                description: "",
                amount:Number(amount),
                callback_url: redirectionUrl,
                redirect: true,
                notes:{
                    variantId : this.variantId
                },
                theme: {
                    color: "#3399cc"
                }
            };
            console.log(options)
            const rzp = new Razorpay(options);
            rzp.open(); 
        }catch(err){
            throw new Error("Failed to initb razorpay checkout reason -->" + err.message);
        }
    }
    // async handleRazorpaySuccess(){
    //     this.classList.add('loading');
    //     try{
    //         console.log('success function was called')
    //         const url = `/apps/xclusive-payment/customCheckout/success`;
    //         const payload = {
    //             variantId : this.variantId
    //         };
    //         console.log(payload);
    //         const request = await fetch(url,{
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type':'application/json'
    //             },
    //             body: JSON.stringify(payload)
    //         });
    //         const res = await request.json();
    //         if(!res.ok){
    //             throw new Error("Failed to create order");
    //         };
    //         window.location.href = res.statusPageUrl;
    //     }catch(err){
    //         console.log("Failed to handle razorpay success reason -->" + err.message)
    //     }finally{
    //         this.classList.remove('loading');
    //     }
    // }
};

customElements.define("subscription-button",SubscriptionButton) 