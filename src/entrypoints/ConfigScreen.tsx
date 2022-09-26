import { RenderConfigScreenCtx } from "datocms-plugin-sdk";
import { Canvas, Button, TextField, Form, FieldGroup } from "datocms-react-ui";
import { Form as FormHandler, Field } from "react-final-form";

type Props = {
  ctx: RenderConfigScreenCtx;
};

export type ValidParameters = {
  accessToken: string;
  domain: string;
};

type Parameters = ValidParameters;

export default function ConfigScreen({ ctx }: Props) {
  return (
    <Canvas ctx={ctx}>
      <FormHandler<Parameters>
        initialValues={ctx.plugin.attributes.parameters}
        validate={(values) => {
          const errors: Record<string, string> = {};
          if (!values.accessToken) {
            errors.accessToken = "This field is required!";
          }
          if (!values.domain) {
            errors.domain = "This field is required!";
          }
          return errors;
        }}
        onSubmit={async (values) => {
          await ctx.updatePluginParameters(values);
          ctx.notice("Settings updated successfully!");
        }}
      >
        {({ handleSubmit, submitting, dirty }) => (
          <Form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field name="domain">
                {({ input, meta: { error } }) => (
                  <TextField
                    hint="Your Frontify Domain, e.g. https://datocms.frontify.com"
                    id="domain"
                    label="Domain"
                    placeholder="Domain"
                    required
                    error={error}
                    {...input}
                  />
                )}
              </Field>
              <Field name="accessToken">
                {({ input, meta: { error } }) => (
                  <TextField
                    hint="Your Frontify Access Token (You can generate it here: https://{yourDomain}.frontify.com/api/oauth-access-token/show)"
                    id="accessToken"
                    label="Access Token"
                    placeholder="Access Token"
                    required
                    error={error}
                    textInputProps={{
                      type: "password",
                    }}
                    {...input}
                  />
                )}
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              fullWidth
              buttonSize="l"
              buttonType="primary"
              disabled={submitting || !dirty}
            >
              Save settings
            </Button>
          </Form>
        )}
      </FormHandler>
    </Canvas>
  );
}
