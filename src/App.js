import React, {useEffect} from 'react';
import './App.css';
import Header from "./Header";
import Home from "./Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Checkout from "./Checkout";
import Login from "./Login";
import Orders from "./Orders";
import { auth} from "./firebase";
import {useStateValue} from "./StateProvider";
import Payment from "./Payment";
import { loadStripe } from "@stripe/stripe-js";
import  { Elements } from "@stripe/react-stripe-js";

const promise = loadStripe('pk_test_51J0RSxDP5bygjOP5qFImnxhcEynlWF0IcV962toXTj1fdqHHpcHM3znmP7qj0fTN50alMZNGvYSDL11KeSu2w0Pi00Ht59ItDS');



function App() {
    const [{}, dispatch] = useStateValue();

    useEffect(() => {
        //will only run once when the app component loads...

        auth.onAuthStateChanged(authUser => {
            console.log('THE USER IS >>> ', authUser);

            if (authUser) {
                //the user just logged in / the user was logged in
                dispatch({
                    type: 'SET_USER',
                    user: authUser
                })
            } else {
                //the user is logged out
                dispatch({
                    type: 'SER_USER',
                    user: null
                })
            }
        })
    }, [])

  //BEM
  return (
      <Router>
        <div className="App">
            <Switch>
                <Route path="/orders">
                    <Header />
                    <Orders />
                </Route>
                <Route path="/login">
                    <Login />
                </Route>
                <Route path="/checkout">
                    <Header />
                    <Checkout />
                </Route>
                <Route path="/payment">
                    <Header />
                    <Elements stripe={promise}>
                        <Payment />
                    </Elements>
                </Route>
                <Route path="/">
                    <Header />
                    <Home />
                </Route>
            </Switch>
        </div>
      </Router>
  );
}

export default App;
