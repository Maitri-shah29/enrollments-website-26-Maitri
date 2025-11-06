import { NextResponse } from "next/server";
import saveFormResponse from "../../actions/save-form-response";

export async function POST(request: Request) {
  try {
    const { formId, questionId, response } = await request.json();

    if (!formId || !questionId) {
      return NextResponse.json(
        { error: "Missing formId or questionId" },
        { status: 400 },
      );
    }

    const result = await saveFormResponse(formId, questionId, response);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Save form response error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save response";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
