import React, {useEffect, useState} from 'react';
import './Payment.css';
import {useStateValue} from "./StateProvider";
import CheckoutProduct from "./CheckoutProduct"; //(dit is de HOOK)
import { Link, useHistory } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import CurrencyFormat from "react-currency-format";
import { getBasketTotal } from "./reducer";
import axios from './axios';//als niet werkt deze opnieuw, mogelijk storing met axios.js
import { db } from "./firebase";

function Payment() {
    const [{ basket, user }, dispatch] = useStateValue();
    const history = useHistory();

    //Deze Stripe hooks gebruiken:
    const stripe = useStripe();
    const elements = useElements();

    //Benodigde useStates maken

    const [succeeded, setSucceeded] = useState(false);
    const [processing, setProcessing] = useState("");

    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(true);

    /////
    const [clientSecret, setClientSecret] = useState(true); //lastig verhaal dit-->6:15:43

    useEffect(() => {
        //generate the special stripe secret which allows us to charge a customer
        //Verbinding met de endpoint maken. Samenvatting zie 6:25:45!!! (API-calls)
        const getClientSecret = async () => {
            const response = await axios({
                method: 'post',
                //Stripe expects the total in a currencies subunits
                url: `/payments/create?total=${getBasketTotal(basket) * 100}`  //Hier lijkt het niet meer te werken (7:08:43)
            });
            setClientSecret(response.data.clientSecret)
        }

        getClientSecret();
    }, [basket])
    ////

    console.log('THE SECRET IS >>>', clientSecret);
    console.log('persoon: ', user);

    //Hier dan de handleSubmit-functie maken.
    const handleSubmit = async (event) => {
        //Do all the Stripe stuff here...
        event.preventDefault(); //(will stop it from refreshing)
        setProcessing(true); //knop blokkeert na 1 keer klikken.


        const payload = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)
            }
        }).then(({ paymentIntent }) => {
            //paymentIntent = payment conformation

            //Verder hieonder op 7:24:56 -->Firebase db code

            db
                .collection('users')
                .doc(user?.uid)
                .collection('orders')
                .doc(paymentIntent.id)
                .set({
                    basket: basket,
                    amount: paymentIntent.amount,
                    created: paymentIntent.created
                })

            setSucceeded(true);
            setError(null)
            setProcessing(false)

            dispatch({
                type: 'EMPTY_BASKET'
            })

            history.replace('/orders')

        })


    }

    //Nu ook de functie handleChange maken
    const handleChange = event => { //dat steepje door event kwam omdat ik "e" in de arrow-functie had gebruikt.
        //Listen for changes in the CardElement
        //and display any errors as the customer types their cart details
        setDisabled(event.empty);
        setError(event.error ? event.error.message: "");
    }

    return (
        <div className='payment'>
            <div className='payment__container'>
                <h1>
                    Checkout (<Link to="/checkout">{basket?.length} items</Link>)
                </h1>
                {/* Payment section - delivery address */}
                <div className='payment__section'>
                    <div className='payment__title'>
                        <h3>Delivery Address</h3>
                    </div>
                    <div className='payment__address'>
                        <p>{user?.email}</p>
                        <p>123 React Lane</p>
                        <p>Los Angeles, CA</p>
                    </div>
                </div>

                {/* Payment section - Review Items */}
                <div className='payment__section'>
                    <div className='payment__title'>
                        <h3>Review items and delivery</h3>
                    </div>
                    <div className='payment__items'>
                        {basket.map(item => (
                            <CheckoutProduct
                                id={item.id}
                                title={item.title}
                                image={item.image}
                                price={item.price}
                                rating={item.rating}
                            />
                        ))}
                    </div>
                </div>

                {/* Payment section - Payment method */}
                <div className='payment__section'>
                    <div className='payment__title'>
                        <h3>Payment Method</h3>
                    </div>
                    <div className='payment__details'>
                        {/* Where the Stripe magic will go */}

                        <form onSubmit={handleSubmit}>
                            <CardElement onChange={handleChange} />

                            <div className='payment__priceContainer'>
                                <CurrencyFormat
                                    renderText={(value) => (
                                        <h3>Order Total: {value}</h3>
                                    )}
                                    decimalScale={2}
                                    value={getBasketTotal(basket)}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                />
                                <button disabled={processing || disabled || succeeded}>
                                    <span>{processing ? <p>Processing</p> : "Buy Now"}</span>
                                </button>
                            </div>

                            {/* Errors */}
                            {error && <div>{error}</div>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Payment;
