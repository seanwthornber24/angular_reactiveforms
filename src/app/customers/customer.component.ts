import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { Customer } from './customer';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { "range": true }
    }
    return null
  }
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl?.pristine || confirmControl?.pristine) {
    return null;
  }

  if (emailControl?.value === confirmControl?.value) {
    return null;
  }
  return { match: true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;
  customer = new Customer();
  emailMessage: string = "";

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get("addresses")
  }

  private validationMessages = {
    required: "Please enter your email address",
    email: "Please enter a valid email address"
  }

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.formBuilder.group({
      firstName: ["", [Validators.required, Validators.minLength(3)]],
      lastName: ["", [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.formBuilder.group({
        email: ["", [Validators.required, Validators.email]],
        confirmEmail: ["", Validators.required],
      }, { validators: emailMatcher }),
      phone: "",
      notification: "email",
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
      addresses: this.formBuilder.array([this.buildAddress()])
    })

    this.customerForm.get("notification")?.valueChanges.subscribe(
      value => this.setNotification(value)
    );

    let emailControl = this.customerForm.get("emailGroup.email")!;
    emailControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    )
  }

  buildAddress(): FormGroup {
    return this.formBuilder.group({
      addressType: "home",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: ""
    })
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: "Sean",
      lastName: "Thornber",
      // email: "seanyT@email.com",
      sendCatalog: false
    })
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get("phone");
    if (notifyVia === "text") {
      phoneControl?.setValidators([Validators.required])
    }
    else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity()
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = "";
    if ((c.touched || c.dirty) && c.errors) {
      let errorMsg = Object.keys(c.errors)[0] as keyof typeof this.validationMessages
      this.emailMessage = this.validationMessages[errorMsg];
    }
  }
}

